# Spend Tracker Application

A comprehensive personal finance tracker to manage your income and expenses with monthly insights.

## 🎯 Features

### ✅ Income & Expense Tracking
- Add income and expense transactions by date
- Categorize transactions with custom categories
- Add descriptions for each transaction
- View transactions by month and year

### ✅ Custom Categories
- Create custom income categories (e.g., Salary, Freelance, Investments)
- Create custom expense categories (e.g., Rent, Groceries, Utilities)
- Delete categories when not needed
- Color-coded categories for easy identification

### ✅ Dashboard Analytics
- **Total Income** - View all income for selected month
- **Total Expenses** - View all expenses for selected month
- **Net Profit** - Automatic calculation (Income - Expenses)
- **Income Breakdown** - See income by category
- **Expense Breakdown** - See expenses by category

### ✅ Month/Year Filtering
- Select any month from the dropdown
- Select any year (2023-2026)
- Data automatically updates based on selection

## 📊 Sample Data

The application comes pre-loaded with sample data for **November 2025**:

### Income Categories:
- 💰 Salary
- 💼 Freelance
- 📈 Investments

### Expense Categories:
- 🏠 Rent
- 🛒 Groceries
- 💡 Utilities
- 🚗 Transport
- 🎬 Entertainment

### Sample Transactions (November 2025):
**Income:**
- Salary: $5,000
- Freelance: $1,200
- **Total Income: $6,200**

**Expenses:**
- Rent: $1,500
- Groceries: $630
- Utilities: $200
- Transport: $150
- **Total Expenses: $2,480**

**Net Profit: $3,720** 💚

## 🚀 How to Use

### Access the Application:
Open your preview URL in the browser to access the Spend Tracker.

### Dashboard Tab:
1. View your financial summary
2. See total income, expenses, and profit
3. View breakdown by category
4. Use month/year selector to view different periods

### Transactions Tab:
1. Click "Add Transaction" button
2. Select type (Income or Expense)
3. Enter amount
4. Select category from dropdown
5. Choose date
6. Add optional description
7. Click "Save"

**View Transactions:**
- All transactions for selected month are displayed
- Color-coded badges (blue for income, red for expense)
- Delete transactions with the trash icon

### Categories Tab:
1. Click "Add Category" button
2. Enter category name
3. Select type (Income or Expense)
4. Click "Save"

**Manage Categories:**
- View all income categories on the left
- View all expense categories on the right
- Delete categories that are no longer needed

## 💡 Tips

1. **Start by setting up categories** that match your financial life
2. **Add transactions regularly** to keep track of spending
3. **Use descriptions** to remember what each transaction was for
4. **Review monthly** to understand your spending patterns
5. **Set goals** based on your profit margins

## 📱 Features Overview

| Feature | Description |
|---------|-------------|
| Dashboard | View income, expenses, and profit at a glance |
| Add Transaction | Record income or expense with date and category |
| Categories | Create custom categories for organizing transactions |
| Monthly View | Filter by month and year |
| Category Breakdown | See spending/income by category |
| Delete | Remove transactions or categories |

## 🔧 Technical Details

### Backend API Endpoints:
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/{id}` - Delete category
- `GET /api/transactions` - Get transactions (with filters)
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/monthly-trend` - Get monthly trends

### Tech Stack:
- **Backend:** FastAPI (Python)
- **Frontend:** React + Tailwind CSS
- **Database:** MongoDB
- **UI Components:** shadcn/ui

## 🎨 UI Features

- **Clean, modern interface** with Tailwind CSS
- **Responsive design** works on all devices
- **Color-coded** income (green) and expenses (red)
- **Interactive forms** for adding data
- **Real-time updates** when adding/deleting
- **Month/Year selectors** for easy navigation

## 📈 Use Cases

- **Personal Finance Management** - Track daily spending
- **Budgeting** - Monitor if you're staying within budget
- **Savings Goals** - See how much you can save each month
- **Expense Analysis** - Understand where money goes
- **Income Tracking** - Monitor all income sources
- **Financial Planning** - Make informed financial decisions

## ✨ Getting Started

1. **Open the application** in your browser
2. **Check November 2025** to see sample data
3. **Add your own categories** for your specific needs
4. **Start adding transactions** as they occur
5. **Review the dashboard** to see your financial health

---

**Status:** ✅ Fully operational and ready to use!

Your Spend Tracker is now live and ready to help you manage your finances effectively!
