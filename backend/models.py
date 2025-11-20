from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, Literal
from datetime import datetime
import uuid


class CategoryBase(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: Optional[str] = "#3B82F6"
    budget_limit: Optional[float] = None  # Budget limit for expense categories
    is_shared: bool = True  # True for shared categories, False for personal
    created_by_user_id: Optional[str] = None  # For personal categories

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: Optional[str] = None  # Categories belong to a family
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TransactionBase(BaseModel):
    amount: float
    category_id: str
    type: Literal["income", "expense"]
    description: Optional[str] = None
    date: datetime

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: Optional[str] = None  # Transactions belong to a family
    user_id: Optional[str] = None  # Track which user created the transaction
    user_name: Optional[str] = None  # For display purposes
    user_icon: Optional[str] = None  # For display purposes
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MonthlyStats(BaseModel):
    month: str
    year: int
    total_income: float
    total_expense: float
    profit: float
    income_by_category: dict
    expense_by_category: dict


class BudgetStatus(BaseModel):
    category_id: str
    category_name: str
    budget_limit: float
    spent: float
    remaining: float
    percentage: float
    status: Literal["safe", "warning", "exceeded"]


class MonthlyBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    month: int
    year: int
    opening_balance: float  # Profit/deficit from previous month
    closing_balance: float  # Profit/deficit for this month
    has_loan: bool = False
    loan_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PeriodStats(BaseModel):
    period_type: str
    start_date: str
    end_date: str
    total_income: float
    total_expense: float
    profit: float
    opening_balance: float
    closing_balance: float
    loan_amount: float
    income_by_category: dict
    expense_by_category: dict


# ============= AUTH & USER MODELS =============
class UserBase(BaseModel):
    name: str
    email: EmailStr
    profile_icon: Optional[str] = "user-circle"  # Icon identifier

class UserCreate(UserBase):
    password: str
    family_code: Optional[str] = None  # Optional family code to join during registration

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserInDB(User):
    password_hash: str


# ============= FAMILY MODELS =============
class FamilyBase(BaseModel):
    name: str

class FamilyCreate(FamilyBase):
    pass

class Family(FamilyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_user_id: str
    family_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============= FAMILY MEMBER MODELS =============
class FamilyMemberBase(BaseModel):
    family_id: str
    user_id: str
    role: Literal["admin", "member"] = "member"

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMember(FamilyMemberBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    joined_at: datetime = Field(default_factory=datetime.utcnow)


# ============= TOKEN MODELS =============
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    family_id: Optional[str] = None


# ============= JOIN REQUEST MODELS =============
class JoinRequestBase(BaseModel):
    family_id: str
    user_id: str
    user_name: str
    user_email: str
    user_icon: str
    status: Literal["pending", "approved", "rejected"] = "pending"

class JoinRequestCreate(JoinRequestBase):
    pass

class JoinRequest(JoinRequestBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
