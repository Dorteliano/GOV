import requests
import sys
from datetime import datetime
import uuid
import json

class RoleBasedAPITester:
    def __init__(self, base_url="https://seattle-gov-admin.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.governor_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_role_id = None
        self.role_access_code = None
        
    def log_test(self, name, success, details="", status_code=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "status_code": status_code
        })
        
    def run_test(self, name, method, endpoint, expected_status, data=None, use_governor_token=False, use_user_token=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_governor_token and self.governor_token:
            headers['Authorization'] = f'Bearer {self.governor_token}'
        elif use_user_token and self.user_token:
            headers['Authorization'] = f'Bearer {self.user_token}'
        elif self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, ensure_ascii=False)}")
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
                
            success = response.status_code == expected_status
            
            if success:
                try:
                    json_response = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}", response.status_code)
                    return True, json_response
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (no JSON)", response.status_code)
                    return True, {}
            else:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                except:
                    error_detail = response.text or 'No response'
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. {error_detail}", response.status_code)
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Network error: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}
            
    def test_check_governor_exists(self):
        """Test check if governor exists"""
        success, response = self.run_test(
            "Check Governor Exists",
            "GET",
            "auth/check-governor",
            200
        )
        if success:
            print(f"   Governor exists: {response.get('exists', 'Unknown')}")
        return success, response
        
    def test_register_governor(self, username, password, secret):
        """Test governor registration"""
        success, response = self.run_test(
            "Register Governor",
            "POST",
            "auth/register-governor",
            200,
            {
                "username": username,
                "password": password,
                "governor_secret": secret
            }
        )
        if success and 'access_token' in response:
            self.governor_token = response['access_token']
            print(f"   🔑 Governor token acquired: {self.governor_token[:20]}...")
            return True, response
        return success, response
        
    def test_governor_login(self, username, password):
        """Test governor login"""
        success, response = self.run_test(
            "Governor Login",
            "POST",
            "auth/login",
            200,
            {
                "username": username,
                "password": password
            }
        )
        if success and 'access_token' in response:
            self.governor_token = response['access_token']
            print(f"   🔑 Governor token acquired: {self.governor_token[:20]}...")
            return True, response
        return success, response
        
    def test_create_role(self):
        """Test role creation by governor"""
        role_data = {
            "name": "Test Minister",
            "permissions": {
                "can_manage_ministries": True,
                "can_manage_news": True,
                "can_manage_legislation": False,
                "can_manage_roles": False,
                "can_delete": False
            }
        }
        
        success, response = self.run_test(
            "Create Role",
            "POST",
            "roles",
            200,
            role_data,
            use_governor_token=True
        )
        
        if success and 'id' in response:
            self.created_role_id = response['id']
            self.role_access_code = response['access_code']
            print(f"   🔑 Role created with code: {self.role_access_code}")
            return True, response
        return success, response
        
    def test_get_roles(self):
        """Test get all roles"""
        return self.run_test(
            "Get All Roles",
            "GET",
            "roles",
            200,
            use_governor_token=True
        )
        
    def test_register_user_with_code(self, username, access_code):
        """Test user registration with access code"""
        success, response = self.run_test(
            "Register User with Access Code",
            "POST",
            "auth/register",
            200,
            {
                "username": username,
                "access_code": access_code
            }
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   🔑 User token acquired: {self.user_token[:20]}...")
            return True, response
        return success, response
        
    def test_user_login(self, username, password):
        """Test user login (password = access code)"""
        success, response = self.run_test(
            "User Login with Access Code",
            "POST",
            "auth/login",
            200,
            {
                "username": username,
                "password": password  # This is the access code for regular users
            }
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   🔑 User login token acquired: {self.user_token[:20]}...")
            return True, response
        return success, response
        
    def test_get_users(self):
        """Test get all users (requires role management permission)"""
        return self.run_test(
            "Get All Users",
            "GET",
            "users",
            200,
            use_governor_token=True
        )
        
    def test_user_permissions_on_ministries(self):
        """Test user can manage ministries with permission"""
        ministry_data = {
            "name": "Test Ministry by User",
            "description": "Created by user with ministry permissions",
            "contact_info": "user@test.gov"
        }
        
        return self.run_test(
            "Create Ministry as User (with permission)",
            "POST",
            "ministries",
            200,
            ministry_data,
            use_user_token=True
        )
        
    def test_user_permissions_on_roles_denied(self):
        """Test user cannot manage roles without permission"""
        role_data = {
            "name": "Unauthorized Role",
            "permissions": {
                "can_manage_ministries": False,
                "can_manage_news": False,
                "can_manage_legislation": False,
                "can_manage_roles": False,
                "can_delete": False
            }
        }
        
        return self.run_test(
            "Create Role as User (should fail)",
            "POST",
            "roles",
            403,  # Should be forbidden
            role_data,
            use_user_token=True
        )
        
    def test_update_role(self):
        """Test update role"""
        if not self.created_role_id:
            return False, {}
            
        update_data = {
            "name": "Updated Test Minister",
            "permissions": {
                "can_manage_ministries": True,
                "can_manage_news": True,
                "can_manage_legislation": True,  # Added legislation permission
                "can_manage_roles": False,
                "can_delete": True  # Added delete permission
            }
        }
        
        return self.run_test(
            "Update Role",
            "PUT",
            f"roles/{self.created_role_id}",
            200,
            update_data,
            use_governor_token=True
        )
        
    def test_regenerate_access_code(self):
        """Test regenerate access code for role"""
        if not self.created_role_id:
            return False, {}
            
        success, response = self.run_test(
            "Regenerate Access Code",
            "POST",
            f"roles/{self.created_role_id}/regenerate-code",
            200,
            use_governor_token=True
        )
        
        if success and 'access_code' in response:
            old_code = self.role_access_code
            self.role_access_code = response['access_code']
            print(f"   🔄 Access code changed: {old_code} → {self.role_access_code}")
            
        return success, response
        
    def test_invalid_governor_secret(self):
        """Test registration with invalid governor secret"""
        return self.run_test(
            "Register Governor with Invalid Secret",
            "POST",
            "auth/register-governor",
            403,  # Should be forbidden
            {
                "username": "fake_governor",
                "password": "password123",
                "governor_secret": "WRONG-SECRET"
            }
        )
        
    def test_invalid_access_code(self):
        """Test user registration with invalid access code"""
        return self.run_test(
            "Register User with Invalid Access Code",
            "POST",
            "auth/register",
            400,  # Should be bad request
            {
                "username": "fake_user",
                "access_code": "INVALID123"
            }
        )
        
    def test_delete_role_with_users(self):
        """Test attempting to delete role that has users (should fail)"""
        if not self.created_role_id:
            return False, {}
            
        # This should fail because we have a user with this role
        return self.run_test(
            "Delete Role with Users (should fail)",
            "DELETE",
            f"roles/{self.created_role_id}",
            400,  # Should fail with users assigned
            use_governor_token=True
        )
        
    def test_auth_me_governor(self):
        """Test /auth/me as governor"""
        success, response = self.run_test(
            "Get Governor Profile (/auth/me)",
            "GET",
            "auth/me",
            200,
            use_governor_token=True
        )
        
        if success:
            print(f"   Governor role: {response.get('role_name', 'Unknown')}")
            print(f"   Permissions: {list(response.get('permissions', {}).keys())}")
            
        return success, response
        
    def test_auth_me_user(self):
        """Test /auth/me as regular user"""
        success, response = self.run_test(
            "Get User Profile (/auth/me)",
            "GET",
            "auth/me",
            200,
            use_user_token=True
        )
        
        if success:
            print(f"   User role: {response.get('role_name', 'Unknown')}")
            enabled_perms = [k for k, v in response.get('permissions', {}).items() if v]
            print(f"   Enabled permissions: {enabled_perms}")
            
        return success, response
            
    def print_summary(self):
        """Print test results summary"""
        print(f"\n" + "="*60)
        print(f"📊 ROLE SYSTEM TEST SUMMARY")
        print(f"="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['name']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting Role-Based Access Control System Testing")
    print("=" * 60)
    
    tester = RoleBasedAPITester()
    
    # Generate unique test data
    timestamp = datetime.now().strftime('%H%M%S')
    test_governor = f"test_gov_{timestamp}"
    test_user = f"test_user_{timestamp}"
    
    print(f"\n👑 PHASE 1: Governor Testing")
    print(f"Governor: {test_governor}")
    
    # Test 1: Check if governor exists
    tester.test_check_governor_exists()
    
    # Test 2: Try invalid governor secret
    tester.test_invalid_governor_secret()
    
    # Test 3: Register governor (or login if exists)
    gov_success, gov_response = tester.test_register_governor(
        test_governor, 
        "gov123", 
        "GOV-MAJESTIC-2024"
    )
    
    if not gov_success:
        print("Governor registration failed, trying to login with existing governor...")
        gov_success, gov_response = tester.test_governor_login("governor", "gov123")
        if not gov_success:
            print("❌ Neither governor registration nor login worked. Stopping tests.")
            tester.print_summary()
            return 1
    
    # Test 4: Check governor profile
    tester.test_auth_me_governor()
    
    print(f"\n🔐 PHASE 2: Role Management")
    
    # Test 5: Create a new role
    tester.test_create_role()
    
    # Test 6: Get all roles
    tester.test_get_roles()
    
    # Test 7: Update the role
    tester.test_update_role()
    
    # Test 8: Regenerate access code
    tester.test_regenerate_access_code()
    
    print(f"\n👤 PHASE 3: User Registration & Login")
    print(f"User: {test_user}")
    
    # Test 9: Try invalid access code
    tester.test_invalid_access_code()
    
    # Test 10: Register user with valid access code
    if tester.role_access_code:
        user_success, user_response = tester.test_register_user_with_code(
            test_user, 
            tester.role_access_code
        )
        
        if not user_success:
            print("❌ User registration failed. Cannot continue with permission tests.")
        else:
            # Test 11: Login user (password = access code)
            tester.test_user_login(test_user, tester.role_access_code)
            
            # Test 12: Check user profile
            tester.test_auth_me_user()
    
    print(f"\n🛡️ PHASE 4: Permission System Testing")
    
    # Test 13: Get all users (governor only)
    tester.test_get_users()
    
    # Test 14: User can create ministry (has permission)
    tester.test_user_permissions_on_ministries()
    
    # Test 15: User cannot create roles (no permission) 
    tester.test_user_permissions_on_roles_denied()
    
    # Test 16: Try to delete role with users (should fail)
    tester.test_delete_role_with_users()
    
    # Print final results
    all_passed = tester.print_summary()
    
    if tester.role_access_code:
        print(f"\n🔑 Test Access Code Generated: {tester.role_access_code}")
        print(f"Use this code to register new users with 'Test Minister' role")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)