from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from collections import defaultdict

from models import (
    Category, CategoryCreate,
    Transaction, TransactionCreate,
    Account, AccountCreate,
    MonthlyStats, BudgetStatus, InvestmentTargetStatus, MonthlyBalance, PeriodStats
)
from auth import get_current_user, get_admin_user
from routes_auth import router as auth_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Spend Tracker")

# Create API router
api_router = APIRouter(prefix="/api")

# Include auth router
app.include_router(auth_router)


# ============= CATEGORY ENDPOINTS =============
@api_router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new category. All members can create shared categories. Only admin can set budget limits."""
    # Only admin can set budget limits
    if category_data.budget_limit:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admin can set budget limits"
            )
    
    category = Category(**category_data.model_dump())
    category.family_id = current_user["family_id"]
    
    # For personal categories, set the creator
    if not category_data.is_shared:
        category.created_by_user_id = current_user["user_id"]
    
    category_doc = category.model_dump()
    category_doc["created_at"] = category_doc["created_at"].isoformat()
    
    await db.categories.insert_one(category_doc)
    return category


@api_router.get("/categories", response_model=List[Category])
async def get_categories(
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get categories for current family. Returns shared + user's personal categories."""
    query = {"family_id": current_user["family_id"]}
    
    if type:
        query["type"] = type
    
    # Get shared categories + user's personal categories
    categories = await db.categories.find({
        **query,
        "$or": [
            {"is_shared": True},
            {"created_by_user_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).to_list(1000)
    
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories


@api_router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Delete a category. Admin only."""
    # Find the category
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# ============= ACCOUNT ENDPOINTS =============
@api_router.post("/accounts", response_model=Account)
async def create_account(
    account_data: AccountCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new account (bank, credit card, cash, other)"""
    account = Account(**account_data.model_dump())
    account.family_id = current_user["family_id"]
    account.current_balance = account_data.opening_balance
    
    # Set owner
    if account_data.owner_type == "personal":
        account.owner_user_id = current_user["user_id"]
    
    account_doc = account.model_dump()
    account_doc["created_at"] = account_doc["created_at"].isoformat()
    
    await db.accounts.insert_one(account_doc)
    return account


@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(
    current_user: dict = Depends(get_current_user)
):
    """Get all accounts for current family (family accounts + user's personal accounts)"""
    accounts = await db.accounts.find({
        "family_id": current_user["family_id"],
        "$or": [
            {"owner_type": "family"},
            {"owner_user_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).to_list(1000)
    
    for acc in accounts:
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    return accounts


@api_router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Delete an account. Admin only."""
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}


# ============= TRANSACTION ENDPOINTS =============
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    # Handle transfer transactions
    if transaction_data.type == "transfer":
        if not transaction_data.account_id or not transaction_data.to_account_id:
            raise HTTPException(status_code=400, detail="Transfer requires both account_id and to_account_id")
        
        # Update account balances
        from_account = await db.accounts.find_one({"id": transaction_data.account_id})
        to_account = await db.accounts.find_one({"id": transaction_data.to_account_id})
        
        if not from_account or not to_account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Deduct from source account
        await db.accounts.update_one(
            {"id": transaction_data.account_id},
            {"$inc": {"current_balance": -transaction_data.amount}}
        )
        
        # Add to destination account
        await db.accounts.update_one(
            {"id": transaction_data.to_account_id},
            {"$inc": {"current_balance": transaction_data.amount}}
        )
    else:
        # Verify category exists for non-transfer transactions
        if not transaction_data.category_id:
            raise HTTPException(status_code=400, detail="Category required for this transaction type")
        
        category = await db.categories.find_one({"id": transaction_data.category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update account balance for non-transfer transactions
        if transaction_data.account_id:
            account = await db.accounts.find_one({"id": transaction_data.account_id})
            if not account:
                raise HTTPException(status_code=404, detail="Account not found")
            
            # Income increases balance, expense/investment decreases balance
            balance_change = transaction_data.amount if transaction_data.type == "income" else -transaction_data.amount
            await db.accounts.update_one(
                {"id": transaction_data.account_id},
                {"$inc": {"current_balance": balance_change}}
            )
    
    # Check budget limit for expense categories
    budget_warning = None
    if transaction_data.type == "expense" and transaction_data.category_id:
        category = await db.categories.find_one({"id": transaction_data.category_id})
        if category and category.get("budget_limit"):
            now = datetime.now()
            month_transactions = await db.transactions.find({
                "category_id": transaction_data.category_id,
                "type": "expense"
            }, {"_id": 0}).to_list(10000)
            
            current_spent = 0
            for trans in month_transactions:
                trans_date = trans.get('date')
                if isinstance(trans_date, str):
                    trans_date = datetime.fromisoformat(trans_date)
                if trans_date.month == now.month and trans_date.year == now.year:
                    current_spent += trans['amount']
            
            new_total = current_spent + transaction_data.amount
            budget_limit = category["budget_limit"]
            
            if new_total >= budget_limit:
                budget_warning = {
                    "message": f"Budget limit reached! Spending ₹{new_total:.2f} of ₹{budget_limit:.2f} budget for {category['name']}",
                    "current_spent": current_spent,
                    "new_total": new_total,
                    "budget_limit": budget_limit,
                    "exceeded": new_total > budget_limit
                }
    
    transaction = Transaction(**transaction_data.model_dump())
    transaction.family_id = current_user["family_id"]
    transaction.user_id = current_user["user_id"]
    
    # Get user details for display
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if user:
        transaction.user_name = user.get("name")
        transaction.user_icon = user.get("profile_icon", "user-circle")
    
    transaction_doc = transaction.model_dump()
    transaction_doc["date"] = transaction_doc["date"].isoformat()
    transaction_doc["created_at"] = transaction_doc["created_at"].isoformat()
    
    await db.transactions.insert_one(transaction_doc)
    
    # Return transaction with budget warning if exists
    if budget_warning:
        return {
            **transaction.model_dump(),
            "budget_warning": budget_warning
        }
    
    return transaction


@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    type: Optional[str] = None,
    user_id: Optional[str] = None,  # Filter by user (for "My Transactions" view)
    current_user: dict = Depends(get_current_user)
):
    """Get transactions for current family. Can filter by user_id for personal view."""
    query = {"family_id": current_user["family_id"]}
    
    if type:
        query["type"] = type
    
    if user_id:
        query["user_id"] = user_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    # Convert ISO strings to datetime
    for trans in transactions:
        if isinstance(trans.get('date'), str):
            trans['date'] = datetime.fromisoformat(trans['date'])
        if isinstance(trans.get('created_at'), str):
            trans['created_at'] = datetime.fromisoformat(trans['created_at'])
    
    # Filter by month/year if provided
    if month or year:
        filtered = []
        for trans in transactions:
            if month and trans['date'].month != month:
                continue
            if year and trans['date'].year != year:
                continue
            filtered.append(trans)
        transactions = filtered
    
    # Sort by date descending
    transactions.sort(key=lambda x: x['date'], reverse=True)
    
    return transactions


@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_admin_user)
):
    """Update transaction. Admin only."""
    existing = await db.transactions.find_one({"id": transaction_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction_data.model_dump()
    update_data["date"] = update_data["date"].isoformat()
    
    await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(updated.get('date'), str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Transaction(**updated)


@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Delete transaction. Admin only."""
    existing = await db.transactions.find_one({"id": transaction_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}


# ============= DASHBOARD STATS =============
async def get_previous_month_balance(month: int, year: int, family_id: str, user_id: Optional[str] = None):
    """Get the closing balance from previous month for a family or specific user"""
    prev_month = month - 1
    prev_year = year
    if prev_month == 0:
        prev_month = 12
        prev_year = year - 1
    
    # Check if balance exists
    balance_query = {
        "month": prev_month,
        "year": prev_year,
        "family_id": family_id
    }
    if user_id:
        balance_query["user_id"] = user_id
    
    balance = await db.monthly_balances.find_one(balance_query)
    
    if balance:
        return balance.get("closing_balance", 0), balance.get("loan_amount", 0)
    
    # Calculate if not exists
    trans_query = {"family_id": family_id}
    if user_id:
        trans_query["user_id"] = user_id
    
    transactions = await db.transactions.find(trans_query, {"_id": 0}).to_list(10000)
    prev_income = 0
    prev_expense = 0
    
    prev_investment = 0
    
    for trans in transactions:
        trans_date = trans.get('date')
        if isinstance(trans_date, str):
            trans_date = datetime.fromisoformat(trans_date)
        if trans_date.month == prev_month and trans_date.year == prev_year:
            if trans['type'] == 'income':
                prev_income += trans['amount']
            elif trans['type'] == 'expense':
                prev_expense += trans['amount']
            elif trans['type'] == 'investment':
                prev_investment += trans['amount']
    
    # profit = income - expense - investment
    prev_profit = prev_income - prev_expense - prev_investment
    prev_loan = abs(prev_profit) if prev_profit < 0 else 0
    
    return prev_profit if prev_profit > 0 else 0, prev_loan


@api_router.get("/dashboard/stats")
async def get_dashboard_stats(
    month: Optional[int] = None,
    year: Optional[int] = None,
    user_id: Optional[str] = None,  # Filter by specific user for "My Transactions" view
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard stats. Can filter by user_id for personal view."""
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    # Get opening balance from previous month
    opening_balance, inherited_loan = await get_previous_month_balance(
        month, year, current_user["family_id"], user_id
    )
    
    # Get all transactions for this family
    query = {"family_id": current_user["family_id"]}
    if user_id:
        query["user_id"] = user_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    # Convert dates and filter
    filtered = []
    for trans in transactions:
        if isinstance(trans.get('date'), str):
            trans['date'] = datetime.fromisoformat(trans['date'])
        if trans['date'].month == month and trans['date'].year == year:
            filtered.append(trans)
    
    transactions = filtered
    
    # Calculate stats
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    total_investment = sum(t['amount'] for t in transactions if t['type'] == 'investment')
    
    # Add opening balance to income
    total_income_with_carryover = total_income + opening_balance
    
    # Calculate profit/loss: profit = income - expense - investment
    profit = total_income_with_carryover - total_expense - total_investment
    closing_balance = profit if profit > 0 else 0
    loan_amount = inherited_loan + abs(profit) if profit < 0 else inherited_loan
    
    # Group by category
    income_by_category = defaultdict(float)
    expense_by_category = defaultdict(float)
    investment_by_category = defaultdict(float)
    
    # Get all categories for names
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    for trans in transactions:
        if trans.get('category_id'):  # Skip transfers
            category_name = category_map.get(trans['category_id'], 'Unknown')
            if trans['type'] == 'income':
                income_by_category[category_name] += trans['amount']
            elif trans['type'] == 'expense':
                expense_by_category[category_name] += trans['amount']
            elif trans['type'] == 'investment':
                investment_by_category[category_name] += trans['amount']
    
    # Add carryover as income category
    if opening_balance > 0:
        income_by_category['Previous Month Profit'] = opening_balance
    
    # Save/update monthly balance
    balance_query = {
        "month": month,
        "year": year,
        "family_id": current_user["family_id"]
    }
    if user_id:
        balance_query["user_id"] = user_id
    
    await db.monthly_balances.update_one(
        balance_query,
        {
            "$set": {
                "opening_balance": opening_balance,
                "closing_balance": closing_balance,
                "has_loan": loan_amount > 0,
                "loan_amount": loan_amount,
                "family_id": current_user["family_id"],
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "total_income": total_income,
        "total_income_with_carryover": total_income_with_carryover,
        "total_expense": total_expense,
        "total_investment": total_investment,
        "profit": profit,
        "opening_balance": opening_balance,
        "closing_balance": closing_balance,
        "inherited_loan": inherited_loan,
        "loan_amount": loan_amount,
        "has_deficit": profit < 0,
        "income_by_category": dict(income_by_category),
        "expense_by_category": dict(expense_by_category),
        "investment_by_category": dict(investment_by_category),
        "transaction_count": len(transactions)
    }


@api_router.get("/dashboard/monthly-trend")
async def get_monthly_trend(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    if not year:
        year = datetime.now().year
    
    transactions = await db.transactions.find(
        {"family_id": current_user["family_id"]},
        {"_id": 0}
    ).to_list(10000)
    
    # Convert dates
    for trans in transactions:
        if isinstance(trans.get('date'), str):
            trans['date'] = datetime.fromisoformat(trans['date'])
    
    # Filter by year
    transactions = [t for t in transactions if t['date'].year == year]
    
    # Group by month
    monthly_data = {}
    for month in range(1, 13):
        month_trans = [t for t in transactions if t['date'].month == month]
        income = sum(t['amount'] for t in month_trans if t['type'] == 'income')
        expense = sum(t['amount'] for t in month_trans if t['type'] == 'expense')
        investment = sum(t['amount'] for t in month_trans if t['type'] == 'investment')
        
        monthly_data[month] = {
            "month": month,
            "income": income,
            "expense": expense,
            "investment": investment,
            "profit": income - expense - investment
        }
    
    return list(monthly_data.values())


# ============= BUDGET ENDPOINTS =============
@api_router.get("/budget/status")
async def get_budget_status(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get budget status. Only shows shared categories (managed by admin)."""
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    # Get all expense categories with budget limits for this family
    categories = await db.categories.find({
        "family_id": current_user["family_id"],
        "type": "expense",
        "budget_limit": {"$exists": True, "$ne": None}
    }, {"_id": 0}).to_list(1000)
    
    budget_statuses = []
    
    for category in categories:
        # Get transactions for this category in the specified month
        transactions = await db.transactions.find({
            "category_id": category["id"],
            "type": "expense"
        }, {"_id": 0}).to_list(10000)
        
        # Filter by month/year and calculate spent
        spent = 0
        for trans in transactions:
            trans_date = trans.get('date')
            if isinstance(trans_date, str):
                trans_date = datetime.fromisoformat(trans_date)
            if trans_date.month == month and trans_date.year == year:
                spent += trans['amount']
        
        budget_limit = category.get("budget_limit", 0)
        remaining = budget_limit - spent
        percentage = (spent / budget_limit * 100) if budget_limit > 0 else 0
        
        # Determine status
        if percentage >= 100:
            status = "exceeded"
        elif percentage >= 80:
            status = "warning"
        else:
            status = "safe"
        
        budget_statuses.append({
            "category_id": category["id"],
            "category_name": category["name"],
            "budget_limit": budget_limit,
            "spent": spent,
            "remaining": remaining,
            "percentage": round(percentage, 2),
            "status": status
        })
    
    return budget_statuses


# ============= PERIOD COMPARISON ENDPOINTS =============
@api_router.get("/dashboard/period-stats")
async def get_period_stats(
    period_type: str = "monthly",  # monthly, quarterly, half-yearly, annual, custom
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    half: Optional[int] = None,
    user_id: Optional[str] = None,  # Filter by user
    current_user: dict = Depends(get_current_user)
):
    """Get statistics for different time periods. Can filter by user."""
    
    if period_type == "custom" and start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    elif period_type == "monthly":
        if not month or not year:
            month = datetime.now().month
            year = datetime.now().year
        start = datetime(year, month, 1)
        # Last day of month
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)
    elif period_type == "quarterly":
        if not quarter or not year:
            raise HTTPException(status_code=400, detail="Quarter and year required")
        start_month = (quarter - 1) * 3 + 1
        start = datetime(year, start_month, 1)
        end_month = start_month + 3
        if end_month > 12:
            end = datetime(year + 1, end_month - 12, 1)
        else:
            end = datetime(year, end_month, 1)
    elif period_type == "half-yearly":
        if not half or not year:
            raise HTTPException(status_code=400, detail="Half and year required")
        start_month = 1 if half == 1 else 7
        start = datetime(year, start_month, 1)
        end_month = 7 if half == 1 else 13
        if end_month == 13:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, end_month, 1)
    elif period_type == "annual":
        if not year:
            year = datetime.now().year
        start = datetime(year, 1, 1)
        end = datetime(year + 1, 1, 1)
    else:
        raise HTTPException(status_code=400, detail="Invalid period type")
    
    # Get transactions in range
    trans_query = {"family_id": current_user["family_id"]}
    if user_id:
        trans_query["user_id"] = user_id
    
    transactions = await db.transactions.find(trans_query, {"_id": 0}).to_list(10000)
    
    filtered = []
    for trans in transactions:
        trans_date = trans.get('date')
        if isinstance(trans_date, str):
            trans_date = datetime.fromisoformat(trans_date)
        if start <= trans_date < end:
            filtered.append(trans)
    
    # Calculate stats
    total_income = sum(t['amount'] for t in filtered if t['type'] == 'income')
    total_expense = sum(t['amount'] for t in filtered if t['type'] == 'expense')
    total_investment = sum(t['amount'] for t in filtered if t['type'] == 'investment')
    profit = total_income - total_expense - total_investment
    
    # Group by category
    income_by_category = defaultdict(float)
    expense_by_category = defaultdict(float)
    investment_by_category = defaultdict(float)
    
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    for trans in filtered:
        if trans.get('category_id'):  # Skip transfers
            category_name = category_map.get(trans['category_id'], 'Unknown')
            if trans['type'] == 'income':
                income_by_category[category_name] += trans['amount']
            elif trans['type'] == 'expense':
                expense_by_category[category_name] += trans['amount']
            elif trans['type'] == 'investment':
                investment_by_category[category_name] += trans['amount']
    
    return {
        "period_type": period_type,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_income": total_income,
        "total_expense": total_expense,
        "total_investment": total_investment,
        "profit": profit,
        "income_by_category": dict(income_by_category),
        "expense_by_category": dict(expense_by_category),
        "investment_by_category": dict(investment_by_category),
        "transaction_count": len(filtered)
    }


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
