#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Spend Tracker Investment and Account Features
Tests all new Investment and Account features as per the review request.
"""

import requests
import json
from datetime import datetime
import uuid

# Base URL from environment
BASE_URL = "https://cashflow-radar.preview.emergentagent.com/api"

class SpendTrackerTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_data = {}
        self.test_accounts = {}
        self.test_categories = {}
        self.test_transactions = []
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add auth header if token exists
        if self.auth_token and headers is None:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
        elif self.auth_token and headers:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {endpoint} -> {response.status_code}")
            
            if response.status_code >= 400:
                self.log(f"ERROR: {response.text}")
                
            return response
            
        except Exception as e:
            self.log(f"REQUEST ERROR: {str(e)}")
            return None
    
    def test_1_setup_user_and_login(self):
        """Test 1: Setup - Create Test User & Login"""
        self.log("=== TEST 1: Setup - Create Test User & Login ===")
        
        # Generate unique test data
        test_id = str(uuid.uuid4())[:8]
        email = f"testuser_{test_id}@example.com"
        password = "TestPassword123!"
        name = f"Test User {test_id}"
        
        # Register new user with family creation
        register_data = {
            "name": name,
            "email": email,
            "password": password,
            "profile_icon": "user-circle"
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: User registration failed")
            return False
            
        # Extract token
        token_data = response.json()
        self.auth_token = token_data.get("access_token")
        
        if not self.auth_token:
            self.log("❌ FAILED: No auth token received")
            return False
            
        self.log("✅ User registered successfully")
        
        # Test login
        login_data = {
            "email": email,
            "password": password
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Login failed")
            return False
            
        # Update token from login
        token_data = response.json()
        self.auth_token = token_data.get("access_token")
        
        self.log("✅ Login successful")
        
        # Get user info
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            self.user_data = response.json()
            self.log(f"✅ User info retrieved: {self.user_data.get('name')}")
        
        return True
    
    def test_2_create_accounts(self):
        """Test 2: Test Account Creation (4 types)"""
        self.log("=== TEST 2: Test Account Creation (4 types) ===")
        
        accounts_to_create = [
            {
                "name": "HDFC Bank",
                "type": "bank",
                "opening_balance": 50000.0,
                "owner_type": "personal"
            },
            {
                "name": "ICICI Credit",
                "type": "credit_card",
                "opening_balance": 0.0,
                "owner_type": "personal"
            },
            {
                "name": "Wallet Cash",
                "type": "cash",
                "opening_balance": 5000.0,
                "owner_type": "family"
            },
            {
                "name": "Investment Wallet",
                "type": "other",
                "opening_balance": 10000.0,
                "owner_type": "family"
            }
        ]
        
        for account_data in accounts_to_create:
            response = self.make_request("POST", "/accounts", account_data)
            if not response or response.status_code != 200:
                self.log(f"❌ FAILED: Could not create {account_data['name']} account")
                return False
                
            account = response.json()
            self.test_accounts[account_data['name']] = account
            self.log(f"✅ Created {account_data['name']} account (ID: {account['id']})")
            
            # Verify current_balance equals opening_balance
            if account['current_balance'] != account_data['opening_balance']:
                self.log(f"❌ FAILED: Balance mismatch for {account_data['name']}")
                return False
        
        # GET /accounts - verify all 4 accounts created
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts")
            return False
            
        accounts = response.json()
        if len(accounts) < 4:
            self.log(f"❌ FAILED: Expected 4 accounts, got {len(accounts)}")
            return False
            
        self.log(f"✅ All 4 accounts created and retrieved successfully")
        return True
    
    def test_3_create_categories_with_investments(self):
        """Test 3: Test Category Creation with Investments"""
        self.log("=== TEST 3: Test Category Creation with Investments ===")
        
        categories_to_create = [
            {
                "name": "Salary",
                "type": "income",
                "color": "#10B981",
                "is_shared": True
            },
            {
                "name": "Groceries",
                "type": "expense",
                "color": "#EF4444",
                "budget_limit": 10000.0,
                "is_shared": True
            },
            {
                "name": "Mutual Funds",
                "type": "investment",
                "color": "#F97316",  # Orange color as requested
                "investment_target": 15000.0,
                "is_shared": True
            },
            {
                "name": "Fixed Deposits",
                "type": "investment",
                "color": "#8B5CF6",
                "investment_target": 20000.0,
                "is_shared": True
            }
        ]
        
        for category_data in categories_to_create:
            response = self.make_request("POST", "/categories", category_data)
            if not response or response.status_code != 200:
                self.log(f"❌ FAILED: Could not create {category_data['name']} category")
                return False
                
            category = response.json()
            self.test_categories[category_data['name']] = category
            self.log(f"✅ Created {category_data['name']} category (ID: {category['id']})")
        
        # GET /categories - verify all categories including investment type
        response = self.make_request("GET", "/categories")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve categories")
            return False
            
        categories = response.json()
        investment_categories = [cat for cat in categories if cat['type'] == 'investment']
        
        if len(investment_categories) < 2:
            self.log(f"❌ FAILED: Expected 2 investment categories, got {len(investment_categories)}")
            return False
            
        self.log(f"✅ All categories created successfully, including {len(investment_categories)} investment categories")
        
        # Verify orange color for Mutual Funds
        mutual_funds = self.test_categories.get('Mutual Funds')
        if mutual_funds and mutual_funds.get('color') == '#F97316':
            self.log("✅ Mutual Funds has correct orange color")
        else:
            self.log("❌ FAILED: Mutual Funds color verification failed")
            return False
            
        return True
    
    def test_4_create_transactions_with_accounts(self):
        """Test 4: Test Transactions with Accounts"""
        self.log("=== TEST 4: Test Transactions with Accounts ===")
        
        transactions_to_create = [
            {
                "amount": 50000.0,
                "category_id": self.test_categories['Salary']['id'],
                "type": "income",
                "description": "Monthly salary",
                "date": datetime.now().isoformat(),
                "account_id": self.test_accounts['HDFC Bank']['id']
            },
            {
                "amount": 3000.0,
                "category_id": self.test_categories['Groceries']['id'],
                "type": "expense",
                "description": "Weekly groceries",
                "date": datetime.now().isoformat(),
                "account_id": self.test_accounts['HDFC Bank']['id']
            },
            {
                "amount": 10000.0,
                "category_id": self.test_categories['Mutual Funds']['id'],
                "type": "investment",
                "description": "SIP investment",
                "date": datetime.now().isoformat(),
                "account_id": self.test_accounts['HDFC Bank']['id']
            },
            {
                "amount": 5000.0,
                "category_id": self.test_categories['Fixed Deposits']['id'],
                "type": "investment",
                "description": "FD investment",
                "date": datetime.now().isoformat(),
                "account_id": self.test_accounts['Wallet Cash']['id']
            }
        ]
        
        for transaction_data in transactions_to_create:
            response = self.make_request("POST", "/transactions", transaction_data)
            if not response or response.status_code != 200:
                self.log(f"❌ FAILED: Could not create transaction: {transaction_data['description']}")
                return False
                
            transaction = response.json()
            self.test_transactions.append(transaction)
            self.log(f"✅ Created transaction: {transaction_data['description']} (₹{transaction_data['amount']})")
        
        # GET /transactions - verify all transactions recorded
        response = self.make_request("GET", "/transactions")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve transactions")
            return False
            
        transactions = response.json()
        if len(transactions) < 4:
            self.log(f"❌ FAILED: Expected at least 4 transactions, got {len(transactions)}")
            return False
            
        self.log(f"✅ All transactions recorded successfully")
        
        # GET /accounts - verify balances updated correctly
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve updated accounts")
            return False
            
        accounts = response.json()
        
        # Find accounts and verify balances
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        cash_account = next((acc for acc in accounts if acc['name'] == 'Wallet Cash'), None)
        
        if not bank_account or not cash_account:
            self.log("❌ FAILED: Could not find test accounts")
            return False
            
        # Bank: 50000 + 50000 - 3000 - 10000 = 87000
        expected_bank_balance = 87000.0
        if abs(bank_account['current_balance'] - expected_bank_balance) > 0.01:
            self.log(f"❌ FAILED: Bank balance mismatch. Expected: {expected_bank_balance}, Got: {bank_account['current_balance']}")
            return False
            
        # Cash: 5000 - 5000 = 0
        expected_cash_balance = 0.0
        if abs(cash_account['current_balance'] - expected_cash_balance) > 0.01:
            self.log(f"❌ FAILED: Cash balance mismatch. Expected: {expected_cash_balance}, Got: {cash_account['current_balance']}")
            return False
            
        self.log(f"✅ Account balances updated correctly - Bank: ₹{bank_account['current_balance']}, Cash: ₹{cash_account['current_balance']}")
        return True
    
    def test_5_transfer_between_accounts(self):
        """Test 5: Test Transfer Between Accounts"""
        self.log("=== TEST 5: Test Transfer Between Accounts ===")
        
        # Transfer ₹10000 from Bank Account to Credit Card
        transfer_data = {
            "amount": 10000.0,
            "type": "transfer",
            "description": "Transfer to credit card",
            "date": datetime.now().isoformat(),
            "account_id": self.test_accounts['HDFC Bank']['id'],
            "to_account_id": self.test_accounts['ICICI Credit']['id']
        }
        
        response = self.make_request("POST", "/transactions", transfer_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create transfer transaction")
            return False
            
        self.log("✅ Transfer transaction created successfully")
        
        # GET /accounts - verify balances
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts after transfer")
            return False
            
        accounts = response.json()
        
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        credit_account = next((acc for acc in accounts if acc['name'] == 'ICICI Credit'), None)
        
        if not bank_account or not credit_account:
            self.log("❌ FAILED: Could not find accounts for transfer verification")
            return False
            
        # Bank balance should decrease by 10000 (now 77000)
        expected_bank_balance = 77000.0
        if abs(bank_account['current_balance'] - expected_bank_balance) > 0.01:
            self.log(f"❌ FAILED: Bank balance after transfer. Expected: {expected_bank_balance}, Got: {bank_account['current_balance']}")
            return False
            
        # Credit Card should increase by 10000 (now 10000)
        expected_credit_balance = 10000.0
        if abs(credit_account['current_balance'] - expected_credit_balance) > 0.01:
            self.log(f"❌ FAILED: Credit card balance after transfer. Expected: {expected_credit_balance}, Got: {credit_account['current_balance']}")
            return False
            
        self.log(f"✅ Transfer successful - Bank: ₹{bank_account['current_balance']}, Credit: ₹{credit_account['current_balance']}")
        return True
    
    def test_6_dashboard_stats_with_investments(self):
        """Test 6: Test Dashboard Stats with Investments"""
        self.log("=== TEST 6: Test Dashboard Stats with Investments ===")
        
        # GET /dashboard/stats for current month
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = self.make_request("GET", f"/dashboard/stats?month={current_month}&year={current_year}")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve dashboard stats")
            return False
            
        stats = response.json()
        
        # Verify profit calculation: profit = income - expense - investment
        # Expected: 50000 - 3000 - 15000 = 32000
        expected_profit = 32000.0
        actual_profit = stats.get('profit', 0)
        
        if abs(actual_profit - expected_profit) > 0.01:
            self.log(f"❌ FAILED: Profit calculation mismatch. Expected: {expected_profit}, Got: {actual_profit}")
            return False
            
        # Verify total_investment = 15000
        expected_investment = 15000.0
        actual_investment = stats.get('total_investment', 0)
        
        if abs(actual_investment - expected_investment) > 0.01:
            self.log(f"❌ FAILED: Investment total mismatch. Expected: {expected_investment}, Got: {actual_investment}")
            return False
            
        # Verify investment_by_category contains both investment categories
        investment_by_category = stats.get('investment_by_category', {})
        
        if 'Mutual Funds' not in investment_by_category or 'Fixed Deposits' not in investment_by_category:
            self.log("❌ FAILED: Investment categories missing from stats")
            return False
            
        mutual_funds_amount = investment_by_category.get('Mutual Funds', 0)
        fixed_deposits_amount = investment_by_category.get('Fixed Deposits', 0)
        
        if abs(mutual_funds_amount - 10000.0) > 0.01 or abs(fixed_deposits_amount - 5000.0) > 0.01:
            self.log("❌ FAILED: Investment amounts by category incorrect")
            return False
            
        self.log(f"✅ Dashboard stats correct - Profit: ₹{actual_profit}, Investment: ₹{actual_investment}")
        self.log(f"✅ Investment breakdown - Mutual Funds: ₹{mutual_funds_amount}, Fixed Deposits: ₹{fixed_deposits_amount}")
        return True
    
    def test_7_investment_targets(self):
        """Test 7: Test Investment Targets"""
        self.log("=== TEST 7: Test Investment Targets ===")
        
        # GET /dashboard/investment-targets
        response = self.make_request("GET", "/dashboard/investment-targets")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve investment targets")
            return False
            
        targets = response.json()
        
        if len(targets) < 2:
            self.log(f"❌ FAILED: Expected 2 investment targets, got {len(targets)}")
            return False
            
        # Find Mutual Funds and Fixed Deposits targets
        mutual_funds_target = next((t for t in targets if t['category_name'] == 'Mutual Funds'), None)
        fixed_deposits_target = next((t for t in targets if t['category_name'] == 'Fixed Deposits'), None)
        
        if not mutual_funds_target or not fixed_deposits_target:
            self.log("❌ FAILED: Could not find investment targets")
            return False
            
        # Verify Mutual Funds: invested 10000 / target 15000 (66.67% in_progress)
        if (mutual_funds_target['invested'] != 10000.0 or 
            mutual_funds_target['investment_target'] != 15000.0 or
            abs(mutual_funds_target['percentage'] - 66.67) > 0.1 or
            mutual_funds_target['status'] != 'in_progress'):
            self.log(f"❌ FAILED: Mutual Funds target verification failed")
            self.log(f"Expected: invested=10000, target=15000, percentage=66.67, status=in_progress")
            self.log(f"Got: invested={mutual_funds_target['invested']}, target={mutual_funds_target['investment_target']}, percentage={mutual_funds_target['percentage']}, status={mutual_funds_target['status']}")
            return False
            
        # Verify Fixed Deposits: invested 5000 / target 20000 (25% in_progress)
        if (fixed_deposits_target['invested'] != 5000.0 or 
            fixed_deposits_target['investment_target'] != 20000.0 or
            abs(fixed_deposits_target['percentage'] - 25.0) > 0.1 or
            fixed_deposits_target['status'] != 'in_progress'):
            self.log(f"❌ FAILED: Fixed Deposits target verification failed")
            self.log(f"Expected: invested=5000, target=20000, percentage=25.0, status=in_progress")
            self.log(f"Got: invested={fixed_deposits_target['invested']}, target={fixed_deposits_target['investment_target']}, percentage={fixed_deposits_target['percentage']}, status={fixed_deposits_target['status']}")
            return False
            
        self.log(f"✅ Investment targets correct:")
        self.log(f"  - Mutual Funds: ₹{mutual_funds_target['invested']}/₹{mutual_funds_target['investment_target']} ({mutual_funds_target['percentage']}% {mutual_funds_target['status']})")
        self.log(f"  - Fixed Deposits: ₹{fixed_deposits_target['invested']}/₹{fixed_deposits_target['investment_target']} ({fixed_deposits_target['percentage']}% {fixed_deposits_target['status']})")
        return True
    
    def test_8_budget_status(self):
        """Test 8: Test Budget Status"""
        self.log("=== TEST 8: Test Budget Status ===")
        
        # GET /budget/status
        response = self.make_request("GET", "/budget/status")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve budget status")
            return False
            
        budget_statuses = response.json()
        
        if len(budget_statuses) < 1:
            self.log("❌ FAILED: No budget statuses found")
            return False
            
        # Find Groceries budget
        groceries_budget = next((b for b in budget_statuses if b['category_name'] == 'Groceries'), None)
        
        if not groceries_budget:
            self.log("❌ FAILED: Could not find Groceries budget status")
            return False
            
        # Verify Groceries: spent 3000 / limit 10000 (30% safe)
        if (groceries_budget['spent'] != 3000.0 or 
            groceries_budget['budget_limit'] != 10000.0 or
            abs(groceries_budget['percentage'] - 30.0) > 0.1 or
            groceries_budget['status'] != 'safe'):
            self.log(f"❌ FAILED: Groceries budget verification failed")
            self.log(f"Expected: spent=3000, limit=10000, percentage=30.0, status=safe")
            self.log(f"Got: spent={groceries_budget['spent']}, limit={groceries_budget['budget_limit']}, percentage={groceries_budget['percentage']}, status={groceries_budget['status']}")
            return False
            
        self.log(f"✅ Budget status correct - Groceries: ₹{groceries_budget['spent']}/₹{groceries_budget['budget_limit']} ({groceries_budget['percentage']}% {groceries_budget['status']})")
        return True
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Spend Tracker Investment and Account Features Test Suite")
        self.log(f"Base URL: {self.base_url}")
        
        tests = [
            self.test_1_setup_user_and_login,
            self.test_2_create_accounts,
            self.test_3_create_categories_with_investments,
            self.test_4_create_transactions_with_accounts,
            self.test_5_transfer_between_accounts,
            self.test_6_dashboard_stats_with_investments,
            self.test_7_investment_targets,
            self.test_8_budget_status
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
                    self.log(f"❌ {test.__name__} FAILED")
            except Exception as e:
                failed += 1
                self.log(f"❌ {test.__name__} FAILED with exception: {str(e)}")
            
            self.log("")  # Empty line for readability
        
        self.log("=" * 60)
        self.log(f"TEST SUMMARY: {passed} passed, {failed} failed")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED! Investment and Account features are working correctly.")
        else:
            self.log(f"⚠️  {failed} tests failed. Please check the issues above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = SpendTrackerTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)