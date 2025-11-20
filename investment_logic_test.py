#!/usr/bin/env python3
"""
CRITICAL TEST: Investment Logic Correction Test
Tests that Investment should NOT reduce profit - Investment is a transfer, not expense.

**CRITICAL TEST: Investment should NOT reduce profit**

Test Flow as per review request:
1. Setup - Create User & Login
2. Create Accounts (Bank, Investment, Cash)
3. Create Categories (Income, Expense, Investment)
4. Test Correct Investment Logic:
   - Add Income: ₹100000
   - Add Expense: ₹20000  
   - Add Investment: ₹50000 (should MOVE money, not reduce profit)
   - Verify: Profit = 100000 - 20000 = 80000 (NOT 30000!)
5. Test Transfer (should also not affect profit)
"""

import requests
import json
from datetime import datetime
import uuid

# Base URL from environment
BASE_URL = "https://cashflow-radar.preview.emergentagent.com/api"

class InvestmentLogicTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_data = {}
        self.test_accounts = {}
        self.test_categories = {}
        
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
        """Step 1: Setup - Create User & Login"""
        self.log("=== STEP 1: Setup - Create User & Login ===")
        
        # Generate unique test data
        test_id = str(uuid.uuid4())[:8]
        email = f"investtest_{test_id}@example.com"
        password = "InvestTest123!"
        name = f"Investment Test User {test_id}"
        
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
            
        self.log("✅ User registered and logged in successfully")
        return True
    
    def test_2_create_accounts(self):
        """Step 2: Create Accounts"""
        self.log("=== STEP 2: Create Accounts ===")
        
        accounts_to_create = [
            {
                "name": "HDFC Bank",
                "type": "bank",
                "opening_balance": 100000.0,
                "owner_type": "personal"
            },
            {
                "name": "Mutual Fund Account",
                "type": "other",
                "opening_balance": 0.0,
                "owner_type": "personal"
            },
            {
                "name": "Wallet",
                "type": "cash",
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
            self.log(f"✅ Created {account_data['name']} account (Balance: ₹{account['current_balance']})")
        
        return True
    
    def test_3_create_categories(self):
        """Step 3: Create Categories"""
        self.log("=== STEP 3: Create Categories ===")
        
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
                "is_shared": True
            },
            {
                "name": "Equity Investments",
                "type": "investment",
                "color": "#F97316",
                "investment_target": 50000.0,
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
            self.log(f"✅ Created {category_data['name']} category")
        
        return True
    
    def test_4_correct_investment_logic(self):
        """Step 4: Test Correct Investment Logic - CRITICAL TEST"""
        self.log("=== STEP 4: Test Correct Investment Logic - CRITICAL TEST ===")
        
        # Step 4a: Add Income
        self.log("--- Step 4a: Add Income ---")
        income_data = {
            "amount": 100000.0,
            "category_id": self.test_categories['Salary']['id'],
            "type": "income",
            "description": "Monthly salary",
            "date": datetime.now().isoformat(),
            "account_id": self.test_accounts['HDFC Bank']['id']
        }
        
        response = self.make_request("POST", "/transactions", income_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create income transaction")
            return False
        
        self.log("✅ Income transaction created: ₹100000")
        
        # Verify bank account balance: 100000 + 100000 = 200000
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts after income")
            return False
            
        accounts = response.json()
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        
        if not bank_account or bank_account['current_balance'] != 200000.0:
            self.log(f"❌ FAILED: Bank balance after income. Expected: 200000, Got: {bank_account['current_balance'] if bank_account else 'None'}")
            return False
            
        self.log("✅ Bank balance after income: ₹200000")
        
        # Step 4b: Add Expense
        self.log("--- Step 4b: Add Expense ---")
        expense_data = {
            "amount": 20000.0,
            "category_id": self.test_categories['Groceries']['id'],
            "type": "expense",
            "description": "Monthly groceries",
            "date": datetime.now().isoformat(),
            "account_id": self.test_accounts['HDFC Bank']['id']
        }
        
        response = self.make_request("POST", "/transactions", expense_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create expense transaction")
            return False
        
        self.log("✅ Expense transaction created: ₹20000")
        
        # Verify bank account balance: 200000 - 20000 = 180000
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts after expense")
            return False
            
        accounts = response.json()
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        
        if not bank_account or bank_account['current_balance'] != 180000.0:
            self.log(f"❌ FAILED: Bank balance after expense. Expected: 180000, Got: {bank_account['current_balance'] if bank_account else 'None'}")
            return False
            
        self.log("✅ Bank balance after expense: ₹180000")
        
        # Step 4c: Add Investment (KEY TEST)
        self.log("--- Step 4c: Add Investment (KEY TEST) ---")
        investment_data = {
            "amount": 50000.0,
            "category_id": self.test_categories['Equity Investments']['id'],
            "type": "investment",
            "description": "Equity investment",
            "date": datetime.now().isoformat(),
            "account_id": self.test_accounts['HDFC Bank']['id'],
            "to_account_id": self.test_accounts['Mutual Fund Account']['id']
        }
        
        response = self.make_request("POST", "/transactions", investment_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create investment transaction")
            return False
        
        self.log("✅ Investment transaction created: ₹50000 (from Bank to Investment Account)")
        
        # Verify account balances after investment
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts after investment")
            return False
            
        accounts = response.json()
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        investment_account = next((acc for acc in accounts if acc['name'] == 'Mutual Fund Account'), None)
        
        # Bank: 180000 - 50000 = 130000
        if not bank_account or bank_account['current_balance'] != 130000.0:
            self.log(f"❌ FAILED: Bank balance after investment. Expected: 130000, Got: {bank_account['current_balance'] if bank_account else 'None'}")
            return False
            
        # Investment Account: 0 + 50000 = 50000
        if not investment_account or investment_account['current_balance'] != 50000.0:
            self.log(f"❌ FAILED: Investment account balance. Expected: 50000, Got: {investment_account['current_balance'] if investment_account else 'None'}")
            return False
            
        self.log("✅ Account balances after investment:")
        self.log(f"  - Bank: ₹{bank_account['current_balance']}")
        self.log(f"  - Investment Account: ₹{investment_account['current_balance']}")
        
        # Step 4d: Check Dashboard Stats (CRITICAL VALIDATION)
        self.log("--- Step 4d: Check Dashboard Stats (CRITICAL VALIDATION) ---")
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = self.make_request("GET", f"/dashboard/stats?month={current_month}&year={current_year}")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve dashboard stats")
            return False
            
        stats = response.json()
        
        # CRITICAL VALIDATION
        total_income = stats.get('total_income', 0)
        total_expense = stats.get('total_expense', 0)
        total_investment = stats.get('total_investment', 0)
        profit = stats.get('profit', 0)
        
        self.log(f"Dashboard Stats:")
        self.log(f"  - Total Income: ₹{total_income}")
        self.log(f"  - Total Expense: ₹{total_expense}")
        self.log(f"  - Total Investment: ₹{total_investment}")
        self.log(f"  - Profit: ₹{profit}")
        
        # Validate values
        if total_income != 100000.0:
            self.log(f"❌ FAILED: Total income incorrect. Expected: 100000, Got: {total_income}")
            return False
            
        if total_expense != 20000.0:
            self.log(f"❌ FAILED: Total expense incorrect. Expected: 20000, Got: {total_expense}")
            return False
            
        if total_investment != 50000.0:
            self.log(f"❌ FAILED: Total investment incorrect. Expected: 50000, Got: {total_investment}")
            return False
            
        # CRITICAL TEST: Profit should be 100000 - 20000 = 80000 (NOT 30000!)
        expected_profit = 80000.0  # Income - Expense (Investment should NOT be deducted)
        if abs(profit - expected_profit) > 0.01:
            self.log(f"❌ CRITICAL FAILURE: Profit calculation WRONG!")
            self.log(f"  Expected: ₹{expected_profit} (100000 - 20000)")
            self.log(f"  Got: ₹{profit}")
            self.log(f"  Investment should NOT reduce profit - it's just moving money!")
            return False
            
        self.log("✅ CRITICAL TEST PASSED: Investment does NOT reduce profit!")
        self.log(f"✅ Correct profit calculation: ₹{profit} = ₹{total_income} - ₹{total_expense}")
        self.log("✅ Investment (₹50000) is tracked separately but doesn't affect profit")
        
        return True
    
    def test_5_transfer_should_not_affect_profit(self):
        """Step 5: Test Transfer (should also not affect profit)"""
        self.log("=== STEP 5: Test Transfer (should also not affect profit) ===")
        
        # Transfer ₹10000 from Bank to Cash
        transfer_data = {
            "amount": 10000.0,
            "type": "transfer",
            "description": "Transfer to cash wallet",
            "date": datetime.now().isoformat(),
            "account_id": self.test_accounts['HDFC Bank']['id'],
            "to_account_id": self.test_accounts['Wallet']['id']
        }
        
        response = self.make_request("POST", "/transactions", transfer_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create transfer transaction")
            return False
        
        self.log("✅ Transfer transaction created: ₹10000 (from Bank to Cash)")
        
        # Check dashboard stats - profit should STILL be 80000
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        response = self.make_request("GET", f"/dashboard/stats?month={current_month}&year={current_year}")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve dashboard stats after transfer")
            return False
            
        stats = response.json()
        profit = stats.get('profit', 0)
        
        # Profit should STILL be 80000 (transfers don't affect profit)
        expected_profit = 80000.0
        if abs(profit - expected_profit) > 0.01:
            self.log(f"❌ FAILED: Transfer affected profit! Expected: {expected_profit}, Got: {profit}")
            return False
            
        self.log(f"✅ Transfer does NOT affect profit: ₹{profit} (still 80000)")
        
        # Verify account balances
        response = self.make_request("GET", "/accounts")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve accounts after transfer")
            return False
            
        accounts = response.json()
        bank_account = next((acc for acc in accounts if acc['name'] == 'HDFC Bank'), None)
        cash_account = next((acc for acc in accounts if acc['name'] == 'Wallet'), None)
        
        # Bank: 130000 - 10000 = 120000
        if not bank_account or bank_account['current_balance'] != 120000.0:
            self.log(f"❌ FAILED: Bank balance after transfer. Expected: 120000, Got: {bank_account['current_balance'] if bank_account else 'None'}")
            return False
            
        # Cash: 10000 + 10000 = 20000
        if not cash_account or cash_account['current_balance'] != 20000.0:
            self.log(f"❌ FAILED: Cash balance after transfer. Expected: 20000, Got: {cash_account['current_balance'] if cash_account else 'None'}")
            return False
            
        self.log("✅ Account balances updated correctly after transfer")
        
        return True
    
    def run_investment_logic_test(self):
        """Run the complete investment logic test"""
        self.log("🚀 Starting CRITICAL Investment Logic Test")
        self.log("Testing: Investment should NOT reduce profit - Investment is transfer, not expense")
        self.log(f"Base URL: {self.base_url}")
        self.log("")
        
        tests = [
            self.test_1_setup_user_and_login,
            self.test_2_create_accounts,
            self.test_3_create_categories,
            self.test_4_correct_investment_logic,
            self.test_5_transfer_should_not_affect_profit
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
                    break  # Stop on first failure for this critical test
            except Exception as e:
                failed += 1
                self.log(f"❌ {test.__name__} FAILED with exception: {str(e)}")
                break
            
            self.log("")  # Empty line for readability
        
        self.log("=" * 80)
        self.log(f"INVESTMENT LOGIC TEST SUMMARY: {passed} passed, {failed} failed")
        
        if failed == 0:
            self.log("🎉 CRITICAL TEST PASSED!")
            self.log("✅ Investment logic is CORRECT:")
            self.log("  - Investment moves money between accounts (transfer)")
            self.log("  - Investment does NOT reduce profit")
            self.log("  - Profit = Income - Expense (investment tracked separately)")
            self.log("  - Account balances update correctly")
        else:
            self.log(f"❌ CRITICAL TEST FAILED!")
            self.log("Investment logic needs to be fixed!")
        
        return failed == 0

if __name__ == "__main__":
    tester = InvestmentLogicTester()
    success = tester.run_investment_logic_test()
    exit(0 if success else 1)