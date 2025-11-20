from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime
import uuid


# User Models
class UserBase(BaseModel):
    email: EmailStr
    role: Literal["investor", "admin"] = "investor"

class UserCreate(UserBase):
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    date_of_birth: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    profile: Optional[UserProfile] = None
    kyc_status: Literal["pending", "submitted", "approved", "rejected"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# KYC Models
class KYCSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    personal_documentation: str  # Mock file name
    age_confirmation: bool
    employment_status: str
    source_of_funds: str
    identity_document: Optional[str] = None  # Mock file name
    address_proof: Optional[str] = None  # Mock file name
    status: Literal["pending", "approved", "rejected"] = "pending"
    rejection_reason: Optional[str] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[str] = None

class KYCCreate(BaseModel):
    personal_documentation: str
    age_confirmation: bool
    employment_status: str
    source_of_funds: str
    identity_document: Optional[str] = None
    address_proof: Optional[str] = None

class KYCReview(BaseModel):
    status: Literal["approved", "rejected"]
    rejection_reason: Optional[str] = None


# Deal Models
class DealBase(BaseModel):
    title: str
    description: str
    category: str
    tenure_months: int
    min_investment: float
    target_amount: float
    expected_return: float  # Percentage

class DealCreate(DealBase):
    expires_at: datetime

class Deal(DealBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raised_amount: float = 0.0
    status: Literal["open", "closed", "expired"] = "open"
    expires_at: datetime
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    investor_count: int = 0


# Investment Models
class InvestmentCreate(BaseModel):
    deal_id: str
    amount: float

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    deal_id: str
    amount: float
    profit: float = 0.0
    status: Literal["active", "completed", "withdrawn"] = "active"
    invested_at: datetime = Field(default_factory=datetime.utcnow)


# Syndicate Models
class SyndicateBase(BaseModel):
    name: str
    description: str
    syndicate_type: Literal["primary", "public", "private"]
    deal_id: Optional[str] = None

class SyndicateCreate(SyndicateBase):
    start_date: Optional[datetime] = None

class Syndicate(SyndicateBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["active", "blocked", "closed"] = "active"
    start_date: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    member_count: int = 0
    total_investment: float = 0.0


class SyndicateMemberAdd(BaseModel):
    user_id: str
    investment_amount: float = 0.0

class SyndicateMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    syndicate_id: str
    user_id: str
    investment_amount: float = 0.0
    joined_at: datetime = Field(default_factory=datetime.utcnow)


# Withdrawal Models
class WithdrawalCreate(BaseModel):
    amount: float
    reason: Optional[str] = None

class Withdrawal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    reason: Optional[str] = None
    status: Literal["pending", "approved", "rejected", "completed"] = "pending"
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None


# Feedback Models
class FeedbackCreate(BaseModel):
    deal_id: Optional[str] = None
    message: str
    rating: Optional[int] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    deal_id: Optional[str] = None
    message: str
    rating: Optional[int] = None
    status: Literal["pending", "reviewed"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Response Models
class AuthResponse(BaseModel):
    user: User
    token: str

class MessageResponse(BaseModel):
    message: str

class StatsResponse(BaseModel):
    total_users: int
    total_deals: int
    total_investments: float
    pending_kyc: int
    active_syndicates: int
