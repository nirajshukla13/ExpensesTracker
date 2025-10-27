import requests
import sys
import json
from datetime import datetime

class ExpenseTrackerAPITester:
    def __init__(self, base_url="http://localhost:8000/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "currency": "USD"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return bool(response)

    def test_get_categories(self):
        """Test getting categories"""
        response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return response

    def test_create_category(self):
        """Test creating a custom category"""
        category_data = {
            "name": "Test Category",
            "icon": "Tag",
            "color": "#FF6B6B"
        }
        
        response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data=category_data
        )
        return response.get('id') if response else None

    def test_create_expense(self):
        """Test creating an expense"""
        expense_data = {
            "category": "Food",
            "amount": 25.50,
            "date": "2024-01-15",
            "payment_method": "Credit Card",
            "notes": "Test expense"
        }
        
        response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        return response.get('id') if response else None

    def test_get_expenses(self):
        """Test getting all expenses"""
        response = self.run_test(
            "Get Expenses",
            "GET",
            "expenses",
            200
        )
        return response

    def test_update_expense(self, expense_id):
        """Test updating an expense"""
        if not expense_id:
            self.log_test("Update Expense", False, "No expense ID provided")
            return False
            
        update_data = {
            "amount": 30.00,
            "notes": "Updated test expense"
        }
        
        response = self.run_test(
            "Update Expense",
            "PUT",
            f"expenses/{expense_id}",
            200,
            data=update_data
        )
        return bool(response)

    def test_delete_expense(self, expense_id):
        """Test deleting an expense"""
        if not expense_id:
            self.log_test("Delete Expense", False, "No expense ID provided")
            return False
            
        response = self.run_test(
            "Delete Expense",
            "DELETE",
            f"expenses/{expense_id}",
            200
        )
        return bool(response)

    def test_create_budget(self):
        """Test creating a budget"""
        budget_data = {
            "month": 1,
            "year": 2024,
            "limit": 1000.00
        }
        
        response = self.run_test(
            "Create Budget",
            "POST",
            "budget",
            200,
            data=budget_data
        )
        return bool(response)

    def test_get_budget(self):
        """Test getting budget"""
        response = self.run_test(
            "Get Budget",
            "GET",
            "budget/1/2024",
            200
        )
        return bool(response)

    def test_create_recurring_expense(self):
        """Test creating a recurring expense"""
        recurring_data = {
            "category": "Bills",
            "amount": 100.00,
            "frequency": "monthly",
            "next_date": "2024-02-01",
            "payment_method": "Bank Transfer",
            "notes": "Test recurring expense"
        }
        
        response = self.run_test(
            "Create Recurring Expense",
            "POST",
            "recurring",
            200,
            data=recurring_data
        )
        return response.get('id') if response else None

    def test_get_recurring_expenses(self):
        """Test getting recurring expenses"""
        response = self.run_test(
            "Get Recurring Expenses",
            "GET",
            "recurring",
            200
        )
        return response

    def test_delete_recurring_expense(self, recurring_id):
        """Test deleting a recurring expense"""
        if not recurring_id:
            self.log_test("Delete Recurring Expense", False, "No recurring ID provided")
            return False
            
        response = self.run_test(
            "Delete Recurring Expense",
            "DELETE",
            f"recurring/{recurring_id}",
            200
        )
        return bool(response)

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        return bool(response)

    def test_export_csv(self):
        """Test CSV export"""
        response = self.run_test(
            "Export CSV",
            "GET",
            "export/csv",
            200
        )
        return bool(response)

    def test_export_excel(self):
        """Test Excel export"""
        response = self.run_test(
            "Export Excel",
            "GET",
            "export/excel",
            200
        )
        return bool(response)

    def test_export_pdf(self):
        """Test PDF export"""
        response = self.run_test(
            "Export PDF",
            "GET",
            "export/pdf",
            200
        )
        return bool(response)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Expense Tracker API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test authentication first
        if not self.test_user_registration():
            print("❌ Registration failed, trying login...")
            if not self.test_user_login():
                print("❌ Both registration and login failed, stopping tests")
                return False

        # Test user profile
        self.test_get_user_profile()

        # Test categories
        categories = self.test_get_categories()
        category_id = self.test_create_category()

        # Test expenses
        expense_id = self.test_create_expense()
        self.test_get_expenses()
        if expense_id:
            self.test_update_expense(expense_id)
            # Don't delete the expense yet, we need it for other tests

        # Test budget
        self.test_create_budget()
        self.test_get_budget()

        # Test recurring expenses
        recurring_id = self.test_create_recurring_expense()
        self.test_get_recurring_expenses()
        if recurring_id:
            self.test_delete_recurring_expense(recurring_id)

        # Test dashboard and reports
        self.test_dashboard_stats()

        # Test exports
        self.test_export_csv()
        self.test_export_excel()
        self.test_export_pdf()

        # Clean up - delete the expense we created
        if expense_id:
            self.test_delete_expense(expense_id)

        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")

def main():
    tester = ExpenseTrackerAPITester()
    
    try:
        tester.run_all_tests()
        tester.print_summary()
        
        # Return appropriate exit code
        return 0 if tester.tests_passed == tester.tests_run else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())