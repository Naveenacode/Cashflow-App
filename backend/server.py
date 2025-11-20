from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from models import (
    User, UserCreate, UserLogin, UserProfile, AuthResponse,
    KYCSubmission, KYCCreate, KYCReview,
    Deal, DealCreate,
    Investment, InvestmentCreate,
    Syndicate, SyndicateCreate, SyndicateMember, SyndicateMemberAdd,
    Withdrawal, WithdrawalCreate,
    Feedback, FeedbackCreate,
    MessageResponse, StatsResponse
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_admin_user
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="LA Investment Platform")

# Create API router
api_router = APIRouter(prefix="/api")


# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password"})
    user = User(**user_dict)
    user_doc = user.model_dump()
    user_doc["password_hash"] = hash_password(user_data.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return AuthResponse(user=user, token=token)


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id, "role": user.role})
    
    return AuthResponse(user=user, token=token)


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


# ============= USER ENDPOINTS =============
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


@api_router.put("/users/profile", response_model=User)
async def update_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"profile": profile.model_dump()}}
    )
    
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


# ============= KYC ENDPOINTS =============
@api_router.post("/kyc/submit", response_model=KYCSubmission)
async def submit_kyc(kyc_data: KYCCreate, current_user: dict = Depends(get_current_user)):
    # Check if already submitted
    existing = await db.kyc_submissions.find_one({"user_id": current_user["user_id"]})
    if existing and existing.get("status") != "rejected":
        raise HTTPException(status_code=400, detail="KYC already submitted")
    
    kyc = KYCSubmission(user_id=current_user["user_id"], **kyc_data.model_dump())
    kyc_doc = kyc.model_dump()
    kyc_doc["submitted_at"] = kyc_doc["submitted_at"].isoformat()
    
    await db.kyc_submissions.insert_one(kyc_doc)
    
    # Update user status
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"kyc_status": "submitted"}}
    )
    
    return kyc


@api_router.get("/kyc/status", response_model=Optional[KYCSubmission])
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    kyc_doc = await db.kyc_submissions.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not kyc_doc:
        return None
    
    if isinstance(kyc_doc.get('submitted_at'), str):
        kyc_doc['submitted_at'] = datetime.fromisoformat(kyc_doc['submitted_at'])
    if kyc_doc.get('reviewed_at') and isinstance(kyc_doc['reviewed_at'], str):
        kyc_doc['reviewed_at'] = datetime.fromisoformat(kyc_doc['reviewed_at'])
    
    return KYCSubmission(**kyc_doc)


@api_router.get("/kyc/pending", response_model=List[KYCSubmission])
async def get_pending_kyc(current_user: dict = Depends(get_admin_user)):
    kyc_docs = await db.kyc_submissions.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    for doc in kyc_docs:
        if isinstance(doc.get('submitted_at'), str):
            doc['submitted_at'] = datetime.fromisoformat(doc['submitted_at'])
        if doc.get('reviewed_at') and isinstance(doc['reviewed_at'], str):
            doc['reviewed_at'] = datetime.fromisoformat(doc['reviewed_at'])
    return kyc_docs


@api_router.post("/kyc/{kyc_id}/review", response_model=MessageResponse)
async def review_kyc(kyc_id: str, review: KYCReview, current_user: dict = Depends(get_admin_user)):
    kyc_doc = await db.kyc_submissions.find_one({"id": kyc_id})
    if not kyc_doc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    update_data = {
        "status": review.status,
        "reviewed_at": datetime.utcnow().isoformat(),
        "reviewer_id": current_user["user_id"]
    }
    
    if review.rejection_reason:
        update_data["rejection_reason"] = review.rejection_reason
    
    await db.kyc_submissions.update_one({"id": kyc_id}, {"$set": update_data})
    
    # Update user KYC status
    await db.users.update_one(
        {"id": kyc_doc["user_id"]},
        {"$set": {"kyc_status": review.status}}
    )
    
    return MessageResponse(message=f"KYC {review.status}")


# ============= DEAL ENDPOINTS =============
@api_router.post("/deals", response_model=Deal)
async def create_deal(deal_data: DealCreate, current_user: dict = Depends(get_admin_user)):
    deal = Deal(**deal_data.model_dump(), created_by=current_user["user_id"])
    deal_doc = deal.model_dump()
    deal_doc["created_at"] = deal_doc["created_at"].isoformat()
    deal_doc["expires_at"] = deal_doc["expires_at"].isoformat()
    
    await db.deals.insert_one(deal_doc)
    return deal


@api_router.get("/deals", response_model=List[Deal])
async def get_deals(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    
    deals = await db.deals.find(query, {"_id": 0}).to_list(1000)
    
    # Update expired deals
    current_time = datetime.utcnow()
    for deal in deals:
        if isinstance(deal.get('created_at'), str):
            deal['created_at'] = datetime.fromisoformat(deal['created_at'])
        if isinstance(deal.get('expires_at'), str):
            deal['expires_at'] = datetime.fromisoformat(deal['expires_at'])
        
        if deal['status'] == 'open' and deal['expires_at'] < current_time:
            await db.deals.update_one({"id": deal["id"]}, {"$set": {"status": "expired"}})
            deal['status'] = 'expired'
    
    return deals


@api_router.get("/deals/{deal_id}", response_model=Deal)
async def get_deal(deal_id: str):
    deal_doc = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal_doc:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if isinstance(deal_doc.get('created_at'), str):
        deal_doc['created_at'] = datetime.fromisoformat(deal_doc['created_at'])
    if isinstance(deal_doc.get('expires_at'), str):
        deal_doc['expires_at'] = datetime.fromisoformat(deal_doc['expires_at'])
    
    # Check if expired
    if deal_doc['status'] == 'open' and deal_doc['expires_at'] < datetime.utcnow():
        await db.deals.update_one({"id": deal_id}, {"$set": {"status": "expired"}})
        deal_doc['status'] = 'expired'
    
    return Deal(**deal_doc)


@api_router.put("/deals/{deal_id}", response_model=Deal)
async def update_deal(deal_id: str, deal_data: DealCreate, current_user: dict = Depends(get_admin_user)):
    existing = await db.deals.find_one({"id": deal_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    update_data = deal_data.model_dump()
    update_data["expires_at"] = update_data["expires_at"].isoformat()
    
    await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    
    deal_doc = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if isinstance(deal_doc.get('created_at'), str):
        deal_doc['created_at'] = datetime.fromisoformat(deal_doc['created_at'])
    if isinstance(deal_doc.get('expires_at'), str):
        deal_doc['expires_at'] = datetime.fromisoformat(deal_doc['expires_at'])
    
    return Deal(**deal_doc)


@api_router.delete("/deals/{deal_id}", response_model=MessageResponse)
async def delete_deal(deal_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.deals.delete_one({"id": deal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return MessageResponse(message="Deal deleted successfully")


# ============= INVESTMENT ENDPOINTS =============
@api_router.post("/investments", response_model=Investment)
async def create_investment(investment_data: InvestmentCreate, current_user: dict = Depends(get_current_user)):
    # Check user KYC status
    user = await db.users.find_one({"id": current_user["user_id"]})
    if user.get("kyc_status") != "approved":
        raise HTTPException(status_code=403, detail="KYC approval required to invest")
    
    # Check deal exists and is open
    deal = await db.deals.find_one({"id": investment_data.deal_id})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["status"] != "open":
        raise HTTPException(status_code=400, detail="Deal is not open for investment")
    
    # Check minimum investment
    if investment_data.amount < deal["min_investment"]:
        raise HTTPException(status_code=400, detail=f"Minimum investment is {deal['min_investment']}")
    
    # Check if deal would be overfunded
    if deal["raised_amount"] + investment_data.amount > deal["target_amount"]:
        raise HTTPException(status_code=400, detail="Investment would exceed target amount")
    
    # Create investment
    investment = Investment(user_id=current_user["user_id"], **investment_data.model_dump())
    investment_doc = investment.model_dump()
    investment_doc["invested_at"] = investment_doc["invested_at"].isoformat()
    
    await db.investments.insert_one(investment_doc)
    
    # Update deal
    new_raised = deal["raised_amount"] + investment_data.amount
    update_data = {
        "raised_amount": new_raised,
        "investor_count": deal.get("investor_count", 0) + 1
    }
    
    # Close deal if fully funded
    if new_raised >= deal["target_amount"]:
        update_data["status"] = "closed"
    
    await db.deals.update_one({"id": investment_data.deal_id}, {"$set": update_data})
    
    return investment


@api_router.get("/investments", response_model=List[Investment])
async def get_user_investments(current_user: dict = Depends(get_current_user)):
    investments = await db.investments.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    for inv in investments:
        if isinstance(inv.get('invested_at'), str):
            inv['invested_at'] = datetime.fromisoformat(inv['invested_at'])
    return investments


@api_router.get("/investments/all", response_model=List[Investment])
async def get_all_investments(current_user: dict = Depends(get_admin_user)):
    investments = await db.investments.find({}, {"_id": 0}).to_list(1000)
    for inv in investments:
        if isinstance(inv.get('invested_at'), str):
            inv['invested_at'] = datetime.fromisoformat(inv['invested_at'])
    return investments


# ============= PORTFOLIO ENDPOINT =============
@api_router.get("/portfolio")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    investments = await db.investments.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    
    total_invested = sum(inv["amount"] for inv in investments)
    total_profit = sum(inv.get("profit", 0) for inv in investments)
    active_investments = [inv for inv in investments if inv["status"] == "active"]
    
    # Get deal details for each investment
    for inv in investments:
        deal = await db.deals.find_one({"id": inv["deal_id"]}, {"_id": 0})
        if deal:
            inv["deal_title"] = deal.get("title")
            inv["deal_category"] = deal.get("category")
            inv["expected_return"] = deal.get("expected_return")
        
        if isinstance(inv.get('invested_at'), str):
            inv['invested_at'] = datetime.fromisoformat(inv['invested_at'])
    
    return {
        "investments": investments,
        "total_invested": total_invested,
        "total_profit": total_profit,
        "active_count": len(active_investments),
        "total_count": len(investments)
    }


# ============= SYNDICATE ENDPOINTS =============
@api_router.post("/syndicates", response_model=Syndicate)
async def create_syndicate(syndicate_data: SyndicateCreate, current_user: dict = Depends(get_current_user)):
    syndicate = Syndicate(**syndicate_data.model_dump(), created_by=current_user["user_id"])
    syndicate_doc = syndicate.model_dump()
    syndicate_doc["created_at"] = syndicate_doc["created_at"].isoformat()
    if syndicate_doc.get("start_date"):
        syndicate_doc["start_date"] = syndicate_doc["start_date"].isoformat()
    
    await db.syndicates.insert_one(syndicate_doc)
    return syndicate


@api_router.get("/syndicates", response_model=List[Syndicate])
async def get_syndicates(syndicate_type: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if syndicate_type:
        query["syndicate_type"] = syndicate_type
    if status:
        query["status"] = status
    
    syndicates = await db.syndicates.find(query, {"_id": 0}).to_list(1000)
    for syn in syndicates:
        if isinstance(syn.get('created_at'), str):
            syn['created_at'] = datetime.fromisoformat(syn['created_at'])
        if syn.get('start_date') and isinstance(syn['start_date'], str):
            syn['start_date'] = datetime.fromisoformat(syn['start_date'])
    return syndicates


@api_router.get("/syndicates/{syndicate_id}", response_model=Syndicate)
async def get_syndicate(syndicate_id: str):
    syndicate_doc = await db.syndicates.find_one({"id": syndicate_id}, {"_id": 0})
    if not syndicate_doc:
        raise HTTPException(status_code=404, detail="Syndicate not found")
    
    if isinstance(syndicate_doc.get('created_at'), str):
        syndicate_doc['created_at'] = datetime.fromisoformat(syndicate_doc['created_at'])
    if syndicate_doc.get('start_date') and isinstance(syndicate_doc['start_date'], str):
        syndicate_doc['start_date'] = datetime.fromisoformat(syndicate_doc['start_date'])
    
    return Syndicate(**syndicate_doc)


@api_router.post("/syndicates/{syndicate_id}/members", response_model=SyndicateMember)
async def add_syndicate_member(syndicate_id: str, member_data: SyndicateMemberAdd, current_user: dict = Depends(get_current_user)):
    # Check syndicate exists
    syndicate = await db.syndicates.find_one({"id": syndicate_id})
    if not syndicate:
        raise HTTPException(status_code=404, detail="Syndicate not found")
    
    if syndicate["status"] == "blocked":
        raise HTTPException(status_code=400, detail="Syndicate is blocked")
    
    # Check if user exists
    user = await db.users.find_one({"id": member_data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    existing = await db.syndicate_members.find_one({
        "syndicate_id": syndicate_id,
        "user_id": member_data.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Add member
    member = SyndicateMember(syndicate_id=syndicate_id, **member_data.model_dump())
    member_doc = member.model_dump()
    member_doc["joined_at"] = member_doc["joined_at"].isoformat()
    
    await db.syndicate_members.insert_one(member_doc)
    
    # Update syndicate stats
    await db.syndicates.update_one(
        {"id": syndicate_id},
        {
            "$inc": {
                "member_count": 1,
                "total_investment": member_data.investment_amount
            }
        }
    )
    
    return member


@api_router.get("/syndicates/{syndicate_id}/members", response_model=List[SyndicateMember])
async def get_syndicate_members(syndicate_id: str):
    members = await db.syndicate_members.find({"syndicate_id": syndicate_id}, {"_id": 0}).to_list(1000)
    for member in members:
        if isinstance(member.get('joined_at'), str):
            member['joined_at'] = datetime.fromisoformat(member['joined_at'])
    return members


@api_router.put("/syndicates/{syndicate_id}/block", response_model=MessageResponse)
async def block_syndicate(syndicate_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.syndicates.update_one(
        {"id": syndicate_id},
        {"$set": {"status": "blocked"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Syndicate not found")
    return MessageResponse(message="Syndicate blocked successfully")


@api_router.put("/syndicates/{syndicate_id}/unblock", response_model=MessageResponse)
async def unblock_syndicate(syndicate_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.syndicates.update_one(
        {"id": syndicate_id},
        {"$set": {"status": "active"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Syndicate not found")
    return MessageResponse(message="Syndicate unblocked successfully")


# ============= WITHDRAWAL ENDPOINTS =============
@api_router.post("/withdrawals", response_model=Withdrawal)
async def create_withdrawal(withdrawal_data: WithdrawalCreate, current_user: dict = Depends(get_current_user)):
    withdrawal = Withdrawal(user_id=current_user["user_id"], **withdrawal_data.model_dump())
    withdrawal_doc = withdrawal.model_dump()
    withdrawal_doc["requested_at"] = withdrawal_doc["requested_at"].isoformat()
    
    await db.withdrawals.insert_one(withdrawal_doc)
    return withdrawal


@api_router.get("/withdrawals", response_model=List[Withdrawal])
async def get_user_withdrawals(current_user: dict = Depends(get_current_user)):
    withdrawals = await db.withdrawals.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    for w in withdrawals:
        if isinstance(w.get('requested_at'), str):
            w['requested_at'] = datetime.fromisoformat(w['requested_at'])
        if w.get('processed_at') and isinstance(w['processed_at'], str):
            w['processed_at'] = datetime.fromisoformat(w['processed_at'])
    return withdrawals


@api_router.get("/withdrawals/all", response_model=List[Withdrawal])
async def get_all_withdrawals(current_user: dict = Depends(get_admin_user)):
    withdrawals = await db.withdrawals.find({}, {"_id": 0}).to_list(1000)
    for w in withdrawals:
        if isinstance(w.get('requested_at'), str):
            w['requested_at'] = datetime.fromisoformat(w['requested_at'])
        if w.get('processed_at') and isinstance(w['processed_at'], str):
            w['processed_at'] = datetime.fromisoformat(w['processed_at'])
    return withdrawals


@api_router.put("/withdrawals/{withdrawal_id}/approve", response_model=MessageResponse)
async def approve_withdrawal(withdrawal_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {"$set": {"status": "completed", "processed_at": datetime.utcnow().isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    return MessageResponse(message="Withdrawal approved")


# ============= FEEDBACK ENDPOINTS =============
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(feedback_data: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    feedback = Feedback(user_id=current_user["user_id"], **feedback_data.model_dump())
    feedback_doc = feedback.model_dump()
    feedback_doc["created_at"] = feedback_doc["created_at"].isoformat()
    
    await db.feedback.insert_one(feedback_doc)
    return feedback


@api_router.get("/feedback", response_model=List[Feedback])
async def get_user_feedback(current_user: dict = Depends(get_current_user)):
    feedbacks = await db.feedback.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    for f in feedbacks:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    return feedbacks


@api_router.get("/feedback/all", response_model=List[Feedback])
async def get_all_feedback(current_user: dict = Depends(get_admin_user)):
    feedbacks = await db.feedback.find({}, {"_id": 0}).to_list(1000)
    for f in feedbacks:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    return feedbacks


@api_router.put("/feedback/{feedback_id}/reviewed", response_model=MessageResponse)
async def mark_feedback_reviewed(feedback_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.feedback.update_one(
        {"id": feedback_id},
        {"$set": {"status": "reviewed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return MessageResponse(message="Feedback marked as reviewed")


# ============= ADMIN STATS =============
@api_router.get("/admin/stats", response_model=StatsResponse)
async def get_admin_stats(current_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_deals = await db.deals.count_documents({})
    pending_kyc = await db.kyc_submissions.count_documents({"status": "pending"})
    active_syndicates = await db.syndicates.count_documents({"status": "active"})
    
    # Calculate total investments
    investments = await db.investments.find({}, {"_id": 0, "amount": 1}).to_list(10000)
    total_investments = sum(inv["amount"] for inv in investments)
    
    return StatsResponse(
        total_users=total_users,
        total_deals=total_deals,
        total_investments=total_investments,
        pending_kyc=pending_kyc,
        active_syndicates=active_syndicates
    )


# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
