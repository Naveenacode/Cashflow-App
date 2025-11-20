import React, { useState, useEffect } from 'react';
import './App.css';
import { categoryAPI, transactionAPI, dashboardAPI } from './api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Trash2, Edit, AlertTriangle, ArrowRight } from 'lucide-react';
import PieChart from './components/PieChart';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodType, setPeriodType] = useState('monthly');
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedHalf, setSelectedHalf] = useState(1);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [comparisonPeriod1, setComparisonPeriod1] = useState(null);
  const [comparisonPeriod2, setComparisonPeriod2] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(true);

  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    category_id: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    budget_limit: ''
  });

  const [budgetStatuses, setBudgetStatuses] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      const [categoriesRes, transactionsRes, statsRes, budgetRes] = await Promise.all([
        categoryAPI.getCategories(),
        transactionAPI.getTransactions({ month: selectedMonth, year: selectedYear }),
        dashboardAPI.getStats({ month: selectedMonth, year: selectedYear }),
        dashboardAPI.getBudgetStatus({ month: selectedMonth, year: selectedYear })
      ]);

      setCategories(categoriesRes.data);
      setTransactions(transactionsRes.data);
      setStats(statsRes.data);
      setBudgetStatuses(budgetRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
        date: new Date(transactionForm.date).toISOString()
      };
      const response = await transactionAPI.createTransaction(data);
      
      // Check for budget warning
      if (response.data.budget_warning) {
        const warning = response.data.budget_warning;
        const message = warning.exceeded 
          ? `⚠️ BUDGET EXCEEDED!\n\n${warning.message}\n\nYou are $${(warning.new_total - warning.budget_limit).toFixed(2)} over budget!`
          : `⚠️ BUDGET LIMIT REACHED!\n\n${warning.message}`;
        alert(message);
      }
      
      setShowAddTransaction(false);
      setTransactionForm({
        amount: '',
        category_id: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...categoryForm,
        budget_limit: categoryForm.budget_limit && categoryForm.type === 'expense' 
          ? parseFloat(categoryForm.budget_limit) 
          : null
      };
      await categoryAPI.createCategory(data);
      setShowAddCategory(false);
      setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', budget_limit: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionAPI.deleteTransaction(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.deleteCategory(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Cannot delete category that has transactions');
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="spend-tracker-app">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Spend Tracker</h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border rounded-md px-3 py-2"
                data-testid="month-selector"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border rounded-md px-3 py-2"
                data-testid="year-selector"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              data-testid="dashboard-tab"
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-md ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              data-testid="transactions-tab"
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              data-testid="categories-tab"
            >
              Categories
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6" data-testid="dashboard-view">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="income-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${stats.total_income.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">{months[selectedMonth - 1]} {selectedYear}</p>
                </CardContent>
              </Card>

              <Card data-testid="expense-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${stats.total_expense.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">{months[selectedMonth - 1]} {selectedYear}</p>
                </CardContent>
              </Card>

              <Card data-testid="profit-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${stats.profit.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{months[selectedMonth - 1]} {selectedYear}</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Status */}
            {budgetStatuses.length > 0 && (
              <Card data-testid="budget-status-card">
                <CardHeader>
                  <CardTitle>Budget Status</CardTitle>
                  <CardDescription>Track your spending limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetStatuses.map(budget => (
                      <div key={budget.category_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{budget.category_name}</span>
                          <span className={`text-sm font-semibold ${
                            budget.status === 'exceeded' ? 'text-red-600' :
                            budget.status === 'warning' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            ${budget.spent.toLocaleString()} / ${budget.budget_limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              budget.status === 'exceeded' ? 'bg-red-600' :
                              budget.status === 'warning' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{budget.percentage.toFixed(1)}% used</span>
                          {budget.status === 'exceeded' ? (
                            <span className="text-red-600 font-semibold">⚠️ Over by ${Math.abs(budget.remaining).toLocaleString()}</span>
                          ) : budget.status === 'warning' ? (
                            <span className="text-yellow-600 font-semibold">⚠️ ${budget.remaining.toLocaleString()} remaining</span>
                          ) : (
                            <span className="text-green-600">${budget.remaining.toLocaleString()} remaining</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="income-breakdown">
                <CardHeader>
                  <CardTitle>Income by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.income_by_category).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No income data</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.income_by_category).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{category}</span>
                          <span className="text-sm font-semibold text-green-600">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="expense-breakdown">
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.expense_by_category).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No expense data</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.expense_by_category).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{category}</span>
                          <span className="text-sm font-semibold text-red-600">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6" data-testid="transactions-view">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Transactions</h2>
              <Button onClick={() => setShowAddTransaction(true)} data-testid="add-transaction-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            {showAddTransaction && (
              <Card data-testid="add-transaction-form">
                <CardHeader>
                  <CardTitle>Add New Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm({...transactionForm, type: value})}>
                          <SelectTrigger data-testid="transaction-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                          required
                          data-testid="transaction-amount-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={transactionForm.category_id} onValueChange={(value) => setTransactionForm({...transactionForm, category_id: value})}>
                          <SelectTrigger data-testid="transaction-category-select">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c.type === transactionForm.type).map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={transactionForm.date}
                          onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                          required
                          data-testid="transaction-date-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                        placeholder="Optional description"
                        data-testid="transaction-description-input"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" data-testid="save-transaction-btn">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddTransaction(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions for this month</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="border rounded-lg p-4 flex items-start justify-between" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                              {transaction.type}
                            </Badge>
                            <span className="font-semibold">{getCategoryName(transaction.category_id)}</span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800"
                            data-testid={`delete-transaction-${transaction.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6" data-testid="categories-view">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Categories</h2>
              <Button onClick={() => setShowAddCategory(true)} data-testid="add-category-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {showAddCategory && (
              <Card data-testid="add-category-form">
                <CardHeader>
                  <CardTitle>Add New Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category Name</Label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          required
                          placeholder="e.g., Salary, Rent"
                          data-testid="category-name-input"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={categoryForm.type} onValueChange={(value) => setCategoryForm({...categoryForm, type: value})}>
                          <SelectTrigger data-testid="category-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {categoryForm.type === 'expense' && (
                      <div>
                        <Label>Monthly Budget Limit (Optional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={categoryForm.budget_limit}
                          onChange={(e) => setCategoryForm({...categoryForm, budget_limit: e.target.value})}
                          placeholder="e.g., 1000"
                          data-testid="category-budget-input"
                        />
                        <p className="text-xs text-gray-500 mt-1">Set a monthly spending limit for this category. You'll get alerts when approaching or exceeding this limit.</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button type="submit" data-testid="save-category-btn">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="income-categories">
                <CardHeader>
                  <CardTitle>Income Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'income').map(category => (
                      <div key={category.id} className="flex items-center justify-between border rounded p-3" data-testid={`category-${category.id}`}>
                        <span className="font-medium">{category.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800"
                          data-testid={`delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'income').length === 0 && (
                      <p className="text-gray-500 text-center py-4">No income categories</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="expense-categories">
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'expense').map(category => (
                      <div key={category.id} className="border rounded p-3" data-testid={`category-${category.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium">{category.name}</span>
                            {category.budget_limit && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  Budget: ${category.budget_limit.toLocaleString()}/month
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-800"
                            data-testid={`delete-category-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'expense').length === 0 && (
                      <p className="text-gray-500 text-center py-4">No expense categories</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
