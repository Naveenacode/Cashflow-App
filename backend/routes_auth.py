from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import timedelta
from dotenv import load_dotenv
from pathlib import Path
import os

from models import (
    User, UserCreate, UserLogin, UserInDB, Token,
    Family, FamilyCreate, FamilyMember, FamilyMemberCreate,
    JoinRequest, JoinRequestCreate
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Get database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user. Can either create a new family or join an existing one."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(**user_data.model_dump(exclude={"password", "family_code"}))
    user_in_db = UserInDB(
        **user.model_dump(),
        password_hash=hash_password(user_data.password)
    )
    
    user_doc = user_in_db.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    await db.users.insert_one(user_doc)
    
    # Check if user wants to join existing family
    if user_data.family_code:
        # Find family by code
        family = await db.families.find_one({"family_code": user_data.family_code.upper()}, {"_id": 0})
        if not family:
            # Cleanup: delete the created user
            await db.users.delete_one({"id": user.id})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid family code. Please check and try again."
            )
        
        # Add user to existing family as member
        family_member = FamilyMember(
            family_id=family["id"],
            user_id=user.id,
            role="member"
        )
        member_doc = family_member.model_dump()
        member_doc["joined_at"] = member_doc["joined_at"].isoformat()
        await db.family_members.insert_one(member_doc)
        
        # Create access token with existing family
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.id,
                "family_id": family["id"],
                "role": "member"
            },
            expires_delta=access_token_expires
        )
    else:
        # Create new family for the user (admin)
        family = Family(
            name=f"{user.name}'s Family",
            admin_user_id=user.id
        )
        family_doc = family.model_dump()
        family_doc["created_at"] = family_doc["created_at"].isoformat()
        await db.families.insert_one(family_doc)
        
        # Add user as family member with admin role
        family_member = FamilyMember(
            family_id=family.id,
            user_id=user.id,
            role="admin"
        )
        member_doc = family_member.model_dump()
        member_doc["joined_at"] = member_doc["joined_at"].isoformat()
        await db.family_members.insert_one(member_doc)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.id,
                "family_id": family.id,
                "role": "admin"
            },
            expires_delta=access_token_expires
        )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    # Find user by email
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Get user's family and role
    family_member = await db.family_members.find_one({"user_id": user["id"]}, {"_id": 0})
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not part of any family"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "family_id": family_member["family_id"],
            "role": family_member["role"]
        },
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert datetime
    if isinstance(user.get('created_at'), str):
        from datetime import datetime
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)


@router.get("/family")
async def get_family_info(current_user: dict = Depends(get_current_user)):
    """Get current user's family information"""
    # Get family
    family = await db.families.find_one({"id": current_user["family_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Get all family members
    members = await db.family_members.find({"family_id": current_user["family_id"]}, {"_id": 0}).to_list(100)
    
    # Get user details for each member
    member_details = []
    for member in members:
        user = await db.users.find_one({"id": member["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            member_details.append({
                "user_id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "profile_icon": user.get("profile_icon", "user-circle"),
                "role": member["role"],
                "joined_at": member["joined_at"]
            })
    
    return {
        "family_id": family["id"],
        "family_name": family["name"],
        "family_code": family["family_code"],
        "admin_user_id": family["admin_user_id"],
        "members": member_details,
        "current_user_role": current_user["role"]
    }


@router.post("/join-family", response_model=Token)
async def join_family(family_code: str, current_user: dict = Depends(get_current_user)):
    """Join an existing family using family code. Will leave current family if applicable."""
    # Find family by code
    family = await db.families.find_one({"family_code": family_code.upper()}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Invalid family code")
    
    # Check if user is trying to join their current family
    if current_user["family_id"] == family["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in this family"
        )
    
    # Remove user from current family
    existing_member = await db.family_members.find_one({"user_id": current_user["user_id"]})
    if existing_member:
        # Check if user is the only admin of their current family
        current_family_members = await db.family_members.find({
            "family_id": existing_member["family_id"]
        }).to_list(100)
        
        admin_count = sum(1 for m in current_family_members if m.get("role") == "admin")
        
        if existing_member.get("role") == "admin" and admin_count == 1 and len(current_family_members) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are the only admin in your current family. Please promote another member to admin before leaving."
            )
        
        # Remove from current family
        await db.family_members.delete_one({"user_id": current_user["user_id"]})
    
    # Add user to new family as member
    family_member = FamilyMember(
        family_id=family["id"],
        user_id=current_user["user_id"],
        role="member"
    )
    member_doc = family_member.model_dump()
    member_doc["joined_at"] = member_doc["joined_at"].isoformat()
    await db.family_members.insert_one(member_doc)
    
    # Create new token with updated family_id
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": current_user["user_id"],
            "family_id": family["id"],
            "role": "member"
        },
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.put("/update-profile")
async def update_profile(
    name: str = None,
    profile_icon: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if name:
        update_data["name"] = name
    if profile_icon:
        update_data["profile_icon"] = profile_icon
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}


@router.post("/remove-member")
async def remove_family_member(
    user_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Remove a member from the family (admin only)"""
    # Can't remove yourself
    if user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the family"
        )
    
    # Remove the family member
    result = await db.family_members.delete_one({
        "family_id": current_user["family_id"],
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member removed successfully"}
