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
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Trash2, Edit, AlertTriangle, ArrowRight, LogOut, Users, User as UserIcon } from 'lucide-react';
import PieChart from './components/PieChart';
import LineChart from './components/LineChart';
import { useAuth } from './AuthContext';
import FamilyManagement from './components/FamilyManagement';
import JoinFamily from './components/JoinFamily';

// Profile icon mapping
const PROFILE_ICONS = {
  'user-circle': '👤',
  'user-male': '👨',
  'user-female': '👩',
  'user-child': '🧒',
  'user-elderly': '👴',
  'user-teen': '🧑',
  'user-baby': '👶',
  'user-couple': '👫'
};

function App() {
  const { user, family, logout, isAdmin } = useAuth();
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [showFilteredTransactions, setShowFilteredTransactions] = useState(false);
  const [viewMode, setViewMode] = useState('family'); // 'family' or 'personal'
  
  // Comparison states
  const [comparisonType, setComparisonType] = useState('period'); // 'period' or 'member'
  const [compareMonth1, setCompareMonth1] = useState(new Date().getMonth() + 1);
  const [compareYear1, setCompareYear1] = useState(new Date().getFullYear());
  const [compareMonth2, setCompareMonth2] = useState(new Date().getMonth());
  const [compareYear2, setCompareYear2] = useState(new Date().getFullYear());
  const [compareMember1, setCompareMember1] = useState('');
  const [compareMember2, setCompareMember2] = useState('');
  const [memberComparison, setMemberComparison] = useState(null);

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
    budget_limit: '',
    is_shared: true,
    created_by_user_id: null
  });

  const [budgetStatuses, setBudgetStatuses] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, periodType, selectedQuarter, selectedHalf, customStartDate, customEndDate, viewMode]);

  const fetchData = async () => {
    try {
      let params = {};
      let statsParams = {};
      
      // Add user_id filter for personal view
      if (viewMode === 'personal' && user) {
        params.user_id = user.id;
        statsParams.user_id = user.id;
      }
      
      if (periodType === 'monthly') {
        params = { ...params, month: selectedMonth, year: selectedYear };
        statsParams = { ...statsParams, month: selectedMonth, year: selectedYear };
      } else if (periodType === 'quarterly' || periodType === 'half-yearly' || periodType === 'annual' || periodType === 'custom') {
        // For non-monthly periods, get period stats
        let periodParams = { period_type: periodType };
        if (periodType === 'quarterly') {
          periodParams.quarter = selectedQuarter;
          periodParams.year = selectedYear;
        } else if (periodType === 'half-yearly') {
          periodParams.half = selectedHalf;
          periodParams.year = selectedYear;
        } else if (periodType === 'annual') {
          periodParams.year = selectedYear;
        } else if (periodType === 'custom') {
          if (customStartDate && customEndDate) {
            periodParams.start_date = customStartDate;
            periodParams.end_date = customEndDate;
          } else {
            // Default to current month if custom dates not set
            params = { month: selectedMonth, year: selectedYear };
            statsParams = { month: selectedMonth, year: selectedYear };
          }
        }
        
        if (periodType !== 'custom' || (customStartDate && customEndDate)) {
          const periodStatsRes = await dashboardAPI.getPeriodStats(periodParams);
          setStats({
            ...periodStatsRes.data,
            total_income_with_carryover: periodStatsRes.data.total_income,
            opening_balance: 0,
            closing_balance: periodStatsRes.data.profit > 0 ? periodStatsRes.data.profit : 0,
            loan_amount: 0,
            inherited_loan: 0,
            has_deficit: periodStatsRes.data.profit < 0
          });
          
          // Get transactions for display
          const transactionsRes = await transactionAPI.getTransactions(params);
          setTransactions(transactionsRes.data);
          
          const categoriesRes = await categoryAPI.getCategories();
          setCategories(categoriesRes.data);
          
          setBudgetStatuses([]);
          setLoading(false);
          return;
        }
      }
      
      // Standard monthly fetch
      const [categoriesRes, transactionsRes, statsRes, budgetRes] = await Promise.all([
        categoryAPI.getCategories(),
        transactionAPI.getTransactions(params),
        dashboardAPI.getStats(statsParams),
        dashboardAPI.getBudgetStatus(statsParams)
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
        alert('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        const errorMessage = error.response?.data?.detail || 'Failed to delete category. It may have associated transactions or you may not have permission.';
        alert(errorMessage);
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategoryFilter(categoryName);
    setShowFilteredTransactions(true);
    setActiveTab('transactions');
  };

  const getFilteredTransactions = () => {
    if (!selectedCategoryFilter) return transactions;
    return transactions.filter(t => getCategoryName(t.category_id) === selectedCategoryFilter);
  };

  const loadComparison = async () => {
    try {
      const [period1, period2] = await Promise.all([
        dashboardAPI.getStats({ month: compareMonth1, year: compareYear1 }),
        dashboardAPI.getStats({ month: compareMonth2, year: compareYear2 })
      ]);
      setComparisonPeriod1(period1.data);
      setComparisonPeriod2(period2.data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      alert('Failed to load comparison data');
    }
  };

  const loadMemberComparison = async () => {
    if (!compareMember1 || !compareMember2) {
      alert('Please select two family members to compare');
      return;
    }
    
    try {
      const [member1Data, member2Data] = await Promise.all([
        dashboardAPI.getStats({ 
          month: selectedMonth, 
          year: selectedYear,
          user_id: compareMember1 
        }),
        dashboardAPI.getStats({ 
          month: selectedMonth, 
          year: selectedYear,
          user_id: compareMember2 
        })
      ]);
      
      setMemberComparison({
        member1: member1Data.data,
        member2: member2Data.data
      });
    } catch (error) {
      console.error('Error loading member comparison:', error);
      alert('Failed to load member comparison data');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const pieColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
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
    <div className="min-h-screen bg-gray-900" data-testid="spend-tracker-app">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col space-y-4">
            {/* Top Row: Title, User Info, View Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-3xl font-bold text-white">Spend Tracker</h1>
              
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('family')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'family' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Family
                  </button>
                  <button
                    onClick={() => setViewMode('personal')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'personal' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <UserIcon className="h-4 w-4 inline mr-2" />
                    My Transactions
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{family?.family_name}</div>
                    {isAdmin && (
                      <Badge className="text-xs bg-blue-100 text-blue-800 mt-1">Admin</Badge>
                    )}
                  </div>
                  <div className="text-3xl">{PROFILE_ICONS[user?.profile_icon || 'user-circle']}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    className="ml-2"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Integrated Period Selector */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-white text-sm"
                  data-testid="period-type-selector"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annual">Annual</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {periodType === 'monthly' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Month:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="month-selector"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="year-selector"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {periodType === 'quarterly' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Quarter:</label>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="quarter-selector"
                    >
                      <option value="1">Q1 (Jan-Mar)</option>
                      <option value="2">Q2 (Apr-Jun)</option>
                      <option value="3">Q3 (Jul-Sep)</option>
                      <option value="4">Q4 (Oct-Dec)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {periodType === 'half-yearly' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Half:</label>
                    <select
                      value={selectedHalf}
                      onChange={(e) => setSelectedHalf(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="half-selector"
                    >
                      <option value="1">H1 (Jan-Jun)</option>
                      <option value="2">H2 (Jul-Dec)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {periodType === 'annual' && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border rounded-md px-3 py-2 bg-white text-sm"
                  >
                    {[2023, 2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === 'custom' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="custom-start-date"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                      data-testid="custom-end-date"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
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
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-md ${activeTab === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              data-testid="compare-tab"
            >
              Compare
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 py-2 rounded-md ${activeTab === 'family' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              data-testid="family-tab"
            >
              Family
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6" data-testid="dashboard-view">
            {/* Dashboard Title */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Dashboard for {
                  periodType === 'monthly' ? `${months[selectedMonth - 1]} ${selectedYear}` :
                  periodType === 'quarterly' ? `Q${selectedQuarter} ${selectedYear}` :
                  periodType === 'half-yearly' ? `H${selectedHalf} ${selectedYear}` :
                  periodType === 'annual' ? `Year ${selectedYear}` :
                  periodType === 'custom' && customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` :
                  `${months[selectedMonth - 1]} ${selectedYear}`
                }
              </h2>
            </div>

            {/* PIE CHARTS FIRST - HOME VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="income-pie-chart" className="border-2 border-green-200">
                <CardContent className="pt-6">
                  <PieChart 
                    data={stats.income_by_category} 
                    title="Income by Category"
                    colors={['#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16']}
                    onSliceClick={handleCategoryClick}
                  />
                  <p className="text-center text-xs text-gray-500 mt-4">Click on a category to view transactions</p>
                </CardContent>
              </Card>

              <Card data-testid="expense-pie-chart" className="border-2 border-red-200">
                <CardContent className="pt-6">
                  <PieChart 
                    data={stats.expense_by_category} 
                    title="Expenses by Category"
                    colors={['#EF4444', '#F59E0B', '#EC4899', '#F97316', '#6B7280']}
                    onSliceClick={handleCategoryClick}
                  />
                  <p className="text-center text-xs text-gray-500 mt-4">Click on a category to view transactions</p>
                </CardContent>
              </Card>
            </div>

            {/* SUMMARY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="income-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${stats.total_income.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {periodType === 'monthly' && `${months[selectedMonth - 1]} ${selectedYear}`}
                    {periodType === 'quarterly' && `Q${selectedQuarter} ${selectedYear}`}
                    {periodType === 'half-yearly' && `H${selectedHalf} ${selectedYear}`}
                    {periodType === 'annual' && `Year ${selectedYear}`}
                    {periodType === 'custom' && customStartDate && customEndDate && `${customStartDate} to ${customEndDate}`}
                  </p>
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

            {/* Carryover Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.opening_balance > 0 && (
                <Card data-testid="opening-balance-card" className="border-green-200 bg-green-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${stats.opening_balance.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-700 mt-1">Profit from previous month</p>
                  </CardContent>
                </Card>
              )}

              {stats.closing_balance > 0 && (
                <Card data-testid="closing-balance-card" className="border-blue-200 bg-blue-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${stats.closing_balance.toLocaleString()}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">Will carry to next month</p>
                  </CardContent>
                </Card>
              )}

              {stats.loan_amount > 0 && (
                <Card data-testid="loan-card" className="border-red-200 bg-red-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding Loan</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${stats.loan_amount.toLocaleString()}
                    </div>
                    <p className="text-xs text-red-700 mt-1">Deficit to be covered</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Budget Status - CLICKABLE */}
            {budgetStatuses.length > 0 && (
              <Card data-testid="budget-status-card">
                <CardHeader>
                  <CardTitle>Budget Status</CardTitle>
                  <CardDescription>Track your spending limits - Click to view transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetStatuses.map(budget => (
                      <div 
                        key={budget.category_id} 
                        className="space-y-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border"
                        onClick={() => handleCategoryClick(budget.category_name)}
                      >
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
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6" data-testid="transactions-view">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Transactions</h2>
                {selectedCategoryFilter && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      Filtered by: {selectedCategoryFilter}
                    </Badge>
                    <button 
                      onClick={() => {
                        setSelectedCategoryFilter(null);
                        setShowFilteredTransactions(false);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
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
                {getFilteredTransactions().length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {selectedCategoryFilter ? `No transactions found for ${selectedCategoryFilter}` : 'No transactions for this month'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getFilteredTransactions().map(transaction => (
                      <div key={transaction.id} className="border rounded-lg p-4 flex items-start justify-between" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex items-center space-x-3 flex-1">
                          {/* User Icon (for family view) */}
                          {viewMode === 'family' && transaction.user_icon && (
                            <div className="text-2xl flex-shrink-0" title={transaction.user_name}>
                              {PROFILE_ICONS[transaction.user_icon]}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                                {transaction.type}
                              </Badge>
                              <span className="font-semibold">{getCategoryName(transaction.category_id)}</span>
                              {viewMode === 'family' && transaction.user_name && (
                                <span className="text-xs text-gray-500">by {transaction.user_name}</span>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
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

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6" data-testid="compare-view">
            {/* Comparison Type Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => {
                  setComparisonType('period');
                  setMemberComparison(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  comparisonType === 'period' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compare Periods
              </button>
              <button
                onClick={() => {
                  setComparisonType('member');
                  setComparisonPeriod1(null);
                  setComparisonPeriod2(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  comparisonType === 'member' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compare Members
              </button>
            </div>

            {/* Period Comparison */}
            {comparisonType === 'period' && (
              <Card>
                <CardHeader>
                  <CardTitle>Compare Two Periods</CardTitle>
                  <CardDescription>Select two months to compare side-by-side</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Period 1 */}
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <h3 className="font-semibold text-blue-900">Period 1</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Month</Label>
                        <Select value={compareMonth1.toString()} onValueChange={(v) => setCompareMonth1(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, index) => (
                              <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Input 
                          type="number" 
                          value={compareYear1} 
                          onChange={(e) => setCompareYear1(parseInt(e.target.value))} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Period 2 */}
                  <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                    <h3 className="font-semibold text-green-900">Period 2</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Month</Label>
                        <Select value={compareMonth2.toString()} onValueChange={(v) => setCompareMonth2(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, index) => (
                              <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Input 
                          type="number" 
                          value={compareYear2} 
                          onChange={(e) => setCompareYear2(parseInt(e.target.value))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={loadComparison} className="w-full mt-6" data-testid="load-comparison-btn">
                  Compare Periods
                </Button>
              </CardContent>
            </Card>
            )}

            {/* Comparison Results */}
            {comparisonType === 'period' && comparisonPeriod1 && comparisonPeriod2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Comparison Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Period 1 Summary */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <CardTitle>{months[compareMonth1 - 1]} {compareYear1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Income</span>
                        <span className="text-lg font-bold text-green-600">
                          ${comparisonPeriod1.total_income?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expenses</span>
                        <span className="text-lg font-bold text-red-600">
                          ${comparisonPeriod1.total_expense?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-semibold">Net Profit</span>
                        <span className={`text-xl font-bold ${comparisonPeriod1.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${comparisonPeriod1.profit?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Period 2 Summary */}
                  <Card className="border-2 border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle>{months[compareMonth2 - 1]} {compareYear2}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Income</span>
                        <span className="text-lg font-bold text-green-600">
                          ${comparisonPeriod2.total_income?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expenses</span>
                        <span className="text-lg font-bold text-red-600">
                          ${comparisonPeriod2.total_expense?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-semibold">Net Profit</span>
                        <span className={`text-xl font-bold ${comparisonPeriod2.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${comparisonPeriod2.profit?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Difference Card */}
                <Card className="border-2 border-purple-200">
                  <CardHeader className="bg-purple-50">
                    <CardTitle>Difference Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Income Change</p>
                        <p className={`text-lg font-bold ${(comparisonPeriod2.total_income - comparisonPeriod1.total_income) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(comparisonPeriod2.total_income - comparisonPeriod1.total_income) >= 0 ? '+' : ''}
                          ${(comparisonPeriod2.total_income - comparisonPeriod1.total_income).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Expense Change</p>
                        <p className={`text-lg font-bold ${(comparisonPeriod2.total_expense - comparisonPeriod1.total_expense) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {(comparisonPeriod2.total_expense - comparisonPeriod1.total_expense) >= 0 ? '+' : ''}
                          ${(comparisonPeriod2.total_expense - comparisonPeriod1.total_expense).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Profit Change</p>
                        <p className={`text-lg font-bold ${(comparisonPeriod2.profit - comparisonPeriod1.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(comparisonPeriod2.profit - comparisonPeriod1.profit) >= 0 ? '+' : ''}
                          ${(comparisonPeriod2.profit - comparisonPeriod1.profit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Graph Comparisons */}
                <Card>
                  <CardContent className="pt-6">
                    <LineChart 
                      data1={comparisonPeriod1.income_by_category}
                      data2={comparisonPeriod2.income_by_category}
                      label1={`${months[compareMonth1 - 1]} ${compareYear1}`}
                      label2={`${months[compareMonth2 - 1]} ${compareYear2}`}
                      title="Income Comparison by Category"
                      color1="#3B82F6"
                      color2="#10B981"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <LineChart 
                      data1={comparisonPeriod1.expense_by_category}
                      data2={comparisonPeriod2.expense_by_category}
                      label1={`${months[compareMonth1 - 1]} ${compareYear1}`}
                      label2={`${months[compareMonth2 - 1]} ${compareYear2}`}
                      title="Expense Comparison by Category"
                      color1="#EF4444"
                      color2="#F97316"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <LineChart 
                      data1={{
                        'Profit': comparisonPeriod1.profit
                      }}
                      data2={{
                        'Profit': comparisonPeriod2.profit
                      }}
                      label1={`${months[compareMonth1 - 1]} ${compareYear1}`}
                      label2={`${months[compareMonth2 - 1]} ${compareYear2}`}
                      title="Net Profit Comparison"
                      color1="#8B5CF6"
                      color2="#EC4899"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Member Comparison */}
            {comparisonType === 'member' && (
              <Card>
                <CardHeader>
                  <CardTitle>Compare Family Members</CardTitle>
                  <CardDescription>Compare spending and income between two family members for {months[selectedMonth - 1]} {selectedYear}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Member 1 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-semibold text-blue-900">Member 1</h3>
                      <div>
                        <Label>Select Member</Label>
                        <Select value={compareMember1} onValueChange={setCompareMember1}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {family?.members?.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {PROFILE_ICONS[member.profile_icon]} {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Member 2 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                      <h3 className="font-semibold text-green-900">Member 2</h3>
                      <div>
                        <Label>Select Member</Label>
                        <Select value={compareMember2} onValueChange={setCompareMember2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {family?.members?.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {PROFILE_ICONS[member.profile_icon]} {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button onClick={loadMemberComparison} className="w-full mt-6">
                    Compare Members
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Member Comparison Results */}
            {memberComparison && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Member Comparison Results</h3>
                
                {/* Get member names */}
                {(() => {
                  const member1 = family?.members?.find(m => m.user_id === compareMember1);
                  const member2 = family?.members?.find(m => m.user_id === compareMember2);
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member 1 Summary */}
                        <Card className="border-2 border-blue-200">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="flex items-center space-x-2">
                              <span className="text-2xl">{PROFILE_ICONS[member1?.profile_icon]}</span>
                              <span>{member1?.name}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Income</span>
                              <span className="text-lg font-bold text-green-600">
                                ${memberComparison.member1.total_income?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Expenses</span>
                              <span className="text-lg font-bold text-red-600">
                                ${memberComparison.member1.total_expense?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-semibold">Net</span>
                              <span className={`text-xl font-bold ${memberComparison.member1.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ${memberComparison.member1.profit?.toLocaleString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Member 2 Summary */}
                        <Card className="border-2 border-green-200">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="flex items-center space-x-2">
                              <span className="text-2xl">{PROFILE_ICONS[member2?.profile_icon]}</span>
                              <span>{member2?.name}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Income</span>
                              <span className="text-lg font-bold text-green-600">
                                ${memberComparison.member2.total_income?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Expenses</span>
                              <span className="text-lg font-bold text-red-600">
                                ${memberComparison.member2.total_expense?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-semibold">Net</span>
                              <span className={`text-xl font-bold ${memberComparison.member2.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ${memberComparison.member2.profit?.toLocaleString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Difference Analysis */}
                      <Card className="border-2 border-purple-200">
                        <CardHeader className="bg-purple-50">
                          <CardTitle>Difference Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Income Difference</p>
                              <p className={`text-lg font-bold ${(memberComparison.member2.total_income - memberComparison.member1.total_income) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {member2?.name} {(memberComparison.member2.total_income - memberComparison.member1.total_income) >= 0 ? 'earned' : 'earned less'}
                                <br />
                                ${Math.abs(memberComparison.member2.total_income - memberComparison.member1.total_income).toLocaleString()} more
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Expense Difference</p>
                              <p className={`text-lg font-bold ${(memberComparison.member2.total_expense - memberComparison.member1.total_expense) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {member2?.name} spent
                                <br />
                                ${Math.abs(memberComparison.member2.total_expense - memberComparison.member1.total_expense).toLocaleString()} {(memberComparison.member2.total_expense - memberComparison.member1.total_expense) >= 0 ? 'more' : 'less'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Net Difference</p>
                              <p className={`text-lg font-bold ${(memberComparison.member2.profit - memberComparison.member1.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(memberComparison.member2.profit - memberComparison.member1.profit) >= 0 ? member2?.name : member1?.name}
                                <br />
                                saved ${Math.abs(memberComparison.member2.profit - memberComparison.member1.profit).toLocaleString()} more
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Line Graph Comparisons */}
                      <Card>
                        <CardContent className="pt-6">
                          <LineChart 
                            data1={memberComparison.member1.income_by_category}
                            data2={memberComparison.member2.income_by_category}
                            label1={member1?.name}
                            label2={member2?.name}
                            title="Income Comparison by Category"
                            color1="#3B82F6"
                            color2="#10B981"
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <LineChart 
                            data1={memberComparison.member1.expense_by_category}
                            data2={memberComparison.member2.expense_by_category}
                            label1={member1?.name}
                            label2={member2?.name}
                            title="Expense Comparison by Category"
                            color1="#EF4444"
                            color2="#F97316"
                          />
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            )}
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

                    {/* Shared Category Toggle (All Members) */}
                    <div className="space-y-2">
                      <Label>Category Type</Label>
                      <Select 
                        value={categoryForm.is_shared ? 'shared' : 'personal'} 
                        onValueChange={(value) => setCategoryForm({...categoryForm, is_shared: value === 'shared'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Shared (All family members)</SelectItem>
                          <SelectItem value="personal">Personal (Only for me)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Shared categories can be used by all family members.</p>
                    </div>

                    {categoryForm.type === 'expense' && isAdmin && categoryForm.is_shared && (
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

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div data-testid="family-view">
            <FamilyManagement />
            
            {/* Join Family Section (for members who want to switch families) */}
            {!isAdmin && (
              <div className="mt-6">
                <JoinFamily />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
