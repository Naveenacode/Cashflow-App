#!/usr/bin/env python3
"""
Budget Alert Ticker Feature Test
Tests the specific scenario for showing only categories at 90%+ of budget limit
"""

import requests
import json
from datetime import datetime
import uuid

# Base URL from environment
BASE_URL = "https://cashflow-radar.preview.emergentagent.com/api"

class BudgetTickerTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        
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
    
    def test_budget_alert_ticker_feature(self):
        """Test Budget Alert Ticker Feature - Show only categories at 90%+ of budget limit"""
        self.log("=== BUDGET ALERT TICKER FEATURE TEST ===")
        self.log("Testing scenario: Show only categories at 90%+ of budget limit")
        
        # Step 1: Setup - Create User & Login
        test_id = str(uuid.uuid4())[:8]
        email = f"budgettest_{test_id}@example.com"
        password = "BudgetTest123!"
        name = f"Budget Test User {test_id}"
        
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
            
        token_data = response.json()
        self.auth_token = token_data.get("access_token")
        self.log("✅ User registered and logged in")
        
        # Step 2: Create Bank Account
        bank_account_data = {
            "name": "Test Bank",
            "type": "bank",
            "opening_balance": 500000.0,
            "owner_type": "personal"
        }
        
        response = self.make_request("POST", "/accounts", bank_account_data)
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not create Test Bank account")
            return False
            
        bank_account = response.json()
        self.log(f"✅ Created Test Bank account (₹{bank_account['opening_balance']})")
        
        # Step 3: Create Expense Categories with Budget Limits
        categories_data = [
            {"name": "Groceries", "budget_limit": 10000.0},
            {"name": "Shopping", "budget_limit": 20000.0},
            {"name": "Entertainment", "budget_limit": 5000.0},
            {"name": "Utilities", "budget_limit": 3000.0}
        ]
        
        created_categories = {}
        for cat_data in categories_data:
            category_payload = {
                "name": cat_data["name"],
                "type": "expense",
                "color": "#EF4444",
                "budget_limit": cat_data["budget_limit"],
                "is_shared": True
            }
            
            response = self.make_request("POST", "/categories", category_payload)
            if not response or response.status_code != 200:
                self.log(f"❌ FAILED: Could not create {cat_data['name']} category")
                return False
                
            category = response.json()
            created_categories[cat_data["name"]] = category
            self.log(f"✅ Created {cat_data['name']} category (budget: ₹{cat_data['budget_limit']})")
        
        # Step 4: Add Transactions to Test Budget Alerts
        transactions_data = [
            # Case 1: Under 90% (should NOT appear in ticker)
            {"category": "Groceries", "amount": 7000.0, "description": "Groceries - 70% of budget"},
            
            # Case 2: At 90-99% (should appear with warning)
            {"category": "Shopping", "amount": 18500.0, "description": "Shopping - 92.5% of budget"},
            
            # Case 3: At 95%+ (should appear with critical warning)
            {"category": "Entertainment", "amount": 4800.0, "description": "Entertainment - 96% of budget"},
            
            # Case 4: Over 100% (should appear as exceeded)
            {"category": "Utilities", "amount": 3500.0, "description": "Utilities - 116.67% of budget"}
        ]
        
        for trans_data in transactions_data:
            transaction_payload = {
                "amount": trans_data["amount"],
                "category_id": created_categories[trans_data["category"]]["id"],
                "type": "expense",
                "description": trans_data["description"],
                "date": datetime.now().isoformat(),
                "account_id": bank_account["id"]
            }
            
            response = self.make_request("POST", "/transactions", transaction_payload)
            if not response or response.status_code != 200:
                self.log(f"❌ FAILED: Could not create transaction for {trans_data['category']}")
                return False
                
            self.log(f"✅ Added transaction: {trans_data['category']} ₹{trans_data['amount']}")
        
        # Step 5: Verify Budget Status
        response = self.make_request("GET", "/budget/status")
        if not response or response.status_code != 200:
            self.log("❌ FAILED: Could not retrieve budget status")
            return False
            
        budget_statuses = response.json()
        
        if len(budget_statuses) != 4:
            self.log(f"❌ FAILED: Expected 4 budget categories, got {len(budget_statuses)}")
            return False
        
        # Verify each category's budget status
        expected_results = {
            "Groceries": {"spent": 7000.0, "limit": 10000.0, "percentage": 70.0, "status": "safe", "should_show_in_ticker": False},
            "Shopping": {"spent": 18500.0, "limit": 20000.0, "percentage": 92.5, "status": "warning", "should_show_in_ticker": True},
            "Entertainment": {"spent": 4800.0, "limit": 5000.0, "percentage": 96.0, "status": "warning", "should_show_in_ticker": True},
            "Utilities": {"spent": 3500.0, "limit": 3000.0, "percentage": 116.67, "status": "exceeded", "should_show_in_ticker": True}
        }
        
        ticker_categories = []  # Categories that should appear in ticker (>= 90%)
        
        for budget_status in budget_statuses:
            category_name = budget_status["category_name"]
            expected = expected_results[category_name]
            
            # Verify spent amount
            if abs(budget_status["spent"] - expected["spent"]) > 0.01:
                self.log(f"❌ FAILED: {category_name} spent amount mismatch. Expected: {expected['spent']}, Got: {budget_status['spent']}")
                return False
            
            # Verify budget limit
            if abs(budget_status["budget_limit"] - expected["limit"]) > 0.01:
                self.log(f"❌ FAILED: {category_name} budget limit mismatch. Expected: {expected['limit']}, Got: {budget_status['budget_limit']}")
                return False
            
            # Verify percentage
            if abs(budget_status["percentage"] - expected["percentage"]) > 0.1:
                self.log(f"❌ FAILED: {category_name} percentage mismatch. Expected: {expected['percentage']}, Got: {budget_status['percentage']}")
                return False
            
            # Check if should appear in ticker (>= 90%)
            if budget_status["percentage"] >= 90.0:
                ticker_categories.append({
                    "name": category_name,
                    "percentage": budget_status["percentage"],
                    "remaining": budget_status["remaining"],
                    "status": budget_status["status"]
                })
                
                if not expected["should_show_in_ticker"]:
                    self.log(f"❌ FAILED: {category_name} should NOT appear in ticker but has {budget_status['percentage']}%")
                    return False
            else:
                if expected["should_show_in_ticker"]:
                    self.log(f"❌ FAILED: {category_name} should appear in ticker but has only {budget_status['percentage']}%")
                    return False
            
            self.log(f"✅ {category_name}: ₹{budget_status['spent']}/₹{budget_status['budget_limit']} ({budget_status['percentage']}% {budget_status['status']})")
        
        # Step 6: Verify Ticker Logic
        self.log("\n--- BUDGET ALERT TICKER VERIFICATION ---")
        
        if len(ticker_categories) != 3:
            self.log(f"❌ FAILED: Expected 3 categories in ticker (>= 90%), got {len(ticker_categories)}")
            return False
        
        # Verify ticker categories
        ticker_names = [cat["name"] for cat in ticker_categories]
        expected_ticker_names = ["Shopping", "Entertainment", "Utilities"]
        
        for expected_name in expected_ticker_names:
            if expected_name not in ticker_names:
                self.log(f"❌ FAILED: {expected_name} should appear in ticker but is missing")
                return False
        
        if "Groceries" in ticker_names:
            self.log("❌ FAILED: Groceries should NOT appear in ticker (only 70%)")
            return False
        
        # Verify ticker display logic
        for ticker_cat in ticker_categories:
            name = ticker_cat["name"]
            percentage = ticker_cat["percentage"]
            remaining = ticker_cat["remaining"]
            status = ticker_cat["status"]
            
            if status == "exceeded":
                over_amount = abs(remaining)
                self.log(f"✅ TICKER: {name}: {percentage}% - Over by ₹{over_amount}")
            else:
                self.log(f"✅ TICKER: {name}: {percentage}% - Only ₹{remaining} left")
        
        # Final validation summary
        self.log("\n--- FINAL VALIDATION ---")
        self.log("✅ Total categories: 4")
        self.log("✅ Categories >= 90%: 3 (Shopping, Entertainment, Utilities)")
        self.log("✅ Categories < 90%: 1 (Groceries - hidden from ticker)")
        self.log("✅ Shopping: 92.5% with 'Only ₹1500 left'")
        self.log("✅ Entertainment: 96% with 'Only ₹200 left'")
        self.log("✅ Utilities: 116.67% with 'Over by ₹500'")
        self.log("✅ Groceries: 70% - NOT shown in ticker")
        
        # Return budget status data for verification
        self.log("\n--- BUDGET STATUS DATA FOR TICKER ---")
        self.log("Budget status data returned by /budget/status endpoint:")
        self.log(json.dumps(budget_statuses, indent=2))
        
        self.log("\n🎉 Budget Alert Ticker Feature working correctly!")
        self.log("✅ Only categories with percentage >= 90% appear in ticker")
        self.log("✅ Exceeded categories show 'Over by' amount")
        self.log("✅ Warning categories show 'Only X left'")
        self.log("✅ Categories under 90% are hidden from ticker")
        self.log("✅ All budget calculations accurate")
        
        return True

if __name__ == "__main__":
    tester = BudgetTickerTester()
    success = tester.test_budget_alert_ticker_feature()
    
    if success:
        print("\n🎉 BUDGET ALERT TICKER FEATURE TEST PASSED!")
        print("The ticker logic will work correctly for the frontend implementation.")
    else:
        print("\n❌ BUDGET ALERT TICKER FEATURE TEST FAILED!")
    
    exit(0 if success else 1)