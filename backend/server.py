from fastapi import FastAPI, APIRouter, HTTPException
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
    MonthlyStats, BudgetStatus
)


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


# ============= CATEGORY ENDPOINTS =============
@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    category = Category(**category_data.model_dump())
    category_doc = category.model_dump()
    category_doc["created_at"] = category_doc["created_at"].isoformat()
    
    await db.categories.insert_one(category_doc)
    return category


@api_router.get("/categories", response_model=List[Category])
async def get_categories(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories


@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# ============= TRANSACTION ENDPOINTS =============
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    # Verify category exists
    category = await db.categories.find_one({"id": transaction_data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check budget limit for expense categories
    budget_warning = None
    if transaction_data.type == "expense" and category.get("budget_limit"):
        # Get current month's spending for this category
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
                "message": f"Budget limit reached! Spending ${new_total:.2f} of ${budget_limit:.2f} budget for {category['name']}",
                "current_spent": current_spent,
                "new_total": new_total,
                "budget_limit": budget_limit,
                "exceeded": new_total > budget_limit
            }
    
    transaction = Transaction(**transaction_data.model_dump())
    transaction_doc = transaction.model_dump()
    transaction_doc["date"] = transaction_doc["date"].isoformat()
    transaction_doc["created_at"] = transaction_doc["created_at"].isoformat()
    
    await db.transactions.insert_one(transaction_doc)
    
    # Return transaction with budget warning if exists
    if budget_warning:
        # Create a response that includes both transaction and warning
        return {
            **transaction.model_dump(),
            "budget_warning": budget_warning
        }
    
    return transaction


@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    type: Optional[str] = None
):
    query = {}
    
    if type:
        query["type"] = type
    
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
async def update_transaction(transaction_id: str, transaction_data: TransactionCreate):
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
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}


# ============= DASHBOARD STATS =============
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(month: Optional[int] = None, year: Optional[int] = None):
    # Get all transactions
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    # Convert dates
    for trans in transactions:
        if isinstance(trans.get('date'), str):
            trans['date'] = datetime.fromisoformat(trans['date'])
    
    # Filter by month/year
    if month or year:
        filtered = []
        for trans in transactions:
            if month and trans['date'].month != month:
                continue
            if year and trans['date'].year != year:
                continue
            filtered.append(trans)
        transactions = filtered
    
    # Calculate stats
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    profit = total_income - total_expense
    
    # Group by category
    income_by_category = defaultdict(float)
    expense_by_category = defaultdict(float)
    
    # Get all categories for names
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {cat['id']: cat['name'] for cat in categories}
    
    for trans in transactions:
        category_name = category_map.get(trans['category_id'], 'Unknown')
        if trans['type'] == 'income':
            income_by_category[category_name] += trans['amount']
        else:
            expense_by_category[category_name] += trans['amount']
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "profit": profit,
        "income_by_category": dict(income_by_category),
        "expense_by_category": dict(expense_by_category),
        "transaction_count": len(transactions)
    }


@api_router.get("/dashboard/monthly-trend")
async def get_monthly_trend(year: Optional[int] = None):
    if not year:
        year = datetime.now().year
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
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
        
        monthly_data[month] = {
            "month": month,
            "income": income,
            "expense": expense,
            "profit": income - expense
        }
    
    return list(monthly_data.values())


# ============= BUDGET ENDPOINTS =============
@api_router.get("/budget/status")
async def get_budget_status(month: Optional[int] = None, year: Optional[int] = None):
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    # Get all expense categories with budget limits
    categories = await db.categories.find({
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
