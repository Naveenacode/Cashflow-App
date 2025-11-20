from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime
import uuid


class CategoryBase(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: Optional[str] = "#3B82F6"
    budget_limit: Optional[float] = None  # Budget limit for expense categories

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
