import requests
import sys
from datetime import datetime
import uuid
import json

class GovernmentAPITester:
    def __init__(self, base_url="https://seattle-gov-admin.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
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
        
    def run_test(self, name, method, endpoint, expected_status, data=None, requires_auth=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if requires_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, ensure_ascii=False)}")
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
                
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
            
    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)
        
    def test_user_registration(self, username, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST", 
            "auth/register",
            200,
            {"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token acquired: {self.token[:20]}...")
            return True, response
        return success, response
        
    def test_user_login(self, username, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login", 
            200,
            {"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token acquired: {self.token[:20]}...")
            return True, response
        return success, response
        
    def test_auth_me(self):
        """Test get current user info"""
        return self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200,
            requires_auth=True
        )
        
    def test_get_ministries(self):
        """Test get all ministries"""
        return self.run_test(
            "Get All Ministries",
            "GET",
            "ministries",
            200
        )
        
    def test_create_ministry(self):
        """Test create ministry with full data"""
        ministry_data = {
            "name": "Министерство Тестирования",
            "description": "Тестовое министерство для проверки API",
            "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            "contact_info": "test@gov.sa",
            "minister": {
                "name": "Тест Тестович",
                "photo": None,
                "appointed_date": "2024-01-01",
                "contact": "test@discord.com",
                "deputies": [
                    {
                        "name": "Замзам Замзамович",
                        "position": "Первый заместитель",
                        "appointed_date": "2024-01-02",
                        "contact": "deputy1@test.com"
                    }
                ]
            },
            "staff": ["Сотрудник 1", "Сотрудник 2"]
        }
        
        success, response = self.run_test(
            "Create Ministry",
            "POST",
            "ministries",
            200,
            ministry_data,
            requires_auth=True
        )
        
        if success and 'id' in response:
            return success, response['id']
        return success, None
        
    def test_get_ministry_by_id(self, ministry_id):
        """Test get specific ministry"""
        return self.run_test(
            "Get Ministry by ID",
            "GET",
            f"ministries/{ministry_id}",
            200
        )
        
    def test_update_ministry(self, ministry_id):
        """Test update ministry"""
        update_data = {
            "name": "Министерство Обновленного Тестирования",
            "description": "Обновленное описание министерства",
            "contact_info": "updated@gov.sa",
            "minister": {
                "name": "Обновленный Тестович",
                "appointed_date": "2024-02-01",
                "contact": "updated@discord.com",
                "deputies": []
            },
            "staff": ["Обновленный Сотрудник"]
        }
        
        return self.run_test(
            "Update Ministry",
            "PUT",
            f"ministries/{ministry_id}",
            200,
            update_data,
            requires_auth=True
        )
        
    def test_create_news(self):
        """Test create news"""
        news_data = {
            "title": "Тестовая новость",
            "content": "Содержание тестовой новости для проверки API",
            "image": None
        }
        
        success, response = self.run_test(
            "Create News",
            "POST",
            "news",
            200,
            news_data,
            requires_auth=True
        )
        
        if success and 'id' in response:
            return success, response['id']
        return success, None
        
    def test_get_news(self):
        """Test get all news"""
        return self.run_test(
            "Get All News",
            "GET",
            "news",
            200
        )
        
    def test_get_news_by_id(self, news_id):
        """Test get specific news"""
        return self.run_test(
            "Get News by ID",
            "GET",
            f"news/{news_id}",
            200
        )
        
    def test_create_legislation(self):
        """Test create legislation"""
        law_data = {
            "decree_number": "№001-TEST",
            "title": "Тестовый указ",
            "content": "Содержание тестового указа для проверки законодательства",
            "status": "Active"
        }
        
        success, response = self.run_test(
            "Create Legislation",
            "POST",
            "legislation",
            200,
            law_data,
            requires_auth=True
        )
        
        if success and 'id' in response:
            return success, response['id']
        return success, None
        
    def test_get_legislation(self):
        """Test get all legislation"""
        return self.run_test(
            "Get All Legislation",
            "GET",
            "legislation",
            200
        )
        
    def test_get_legislation_by_id(self, law_id):
        """Test get specific legislation"""
        return self.run_test(
            "Get Legislation by ID",
            "GET",
            f"legislation/{law_id}",
            200
        )
        
    def test_image_upload(self):
        """Test image upload (mock file)"""
        # Note: This creates a minimal test file in memory
        files = {'file': ('test.png', b'fake_image_data', 'image/png')}
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            url = f"{self.base_url}/upload"
            print(f"\n🔍 Testing Image Upload...")
            print(f"   URL: {url}")
            
            response = requests.post(url, files=files, headers=headers, timeout=10)
            
            success = response.status_code == 200
            if success:
                try:
                    json_response = response.json()
                    if 'url' in json_response:
                        self.log_test("Image Upload", True, f"Status: {response.status_code}")
                        return True, json_response
                    else:
                        self.log_test("Image Upload", False, "No URL in response")
                        return False, {}
                except:
                    self.log_test("Image Upload", False, "Invalid JSON response")
                    return False, {}
            else:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                except:
                    error_detail = response.text or 'No response'
                self.log_test("Image Upload", False, f"Status: {response.status_code}. {error_detail}")
                return False, {}
                
        except Exception as e:
            self.log_test("Image Upload", False, f"Error: {str(e)}")
            return False, {}
            
    def test_delete_ministry(self, ministry_id):
        """Test delete ministry"""
        return self.run_test(
            "Delete Ministry",
            "DELETE",
            f"ministries/{ministry_id}",
            200,
            requires_auth=True
        )
        
    def test_delete_news(self, news_id):
        """Test delete news"""
        return self.run_test(
            "Delete News",
            "DELETE",
            f"news/{news_id}",
            200,
            requires_auth=True
        )
        
    def test_delete_legislation(self, law_id):
        """Test delete legislation"""
        return self.run_test(
            "Delete Legislation",
            "DELETE",
            f"legislation/{law_id}",
            200,
            requires_auth=True
        )
            
    def print_summary(self):
        """Print test results summary"""
        print(f"\n" + "="*60)
        print(f"📊 TEST SUMMARY")
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
    print("🚀 Starting Government Portal API Testing")
    print("=" * 60)
    
    tester = GovernmentAPITester()
    
    # Generate unique test user
    test_username = f"test_admin_{datetime.now().strftime('%H%M%S')}"
    test_password = "TestAdmin123!"
    
    # Test basic API availability
    tester.test_root_endpoint()
    
    # Test Authentication
    print(f"\n📝 Testing Authentication with user: {test_username}")
    reg_success, reg_response = tester.test_user_registration(test_username, test_password)
    
    if not reg_success:
        print("❌ Registration failed, trying to login with existing user...")
        login_success, login_response = tester.test_user_login("admin", "admin123")
        if not login_success:
            print("❌ Both registration and login failed. Stopping tests.")
            tester.print_summary()
            return 1
    
    # Test auth/me endpoint
    tester.test_auth_me()
    
    # Test Ministries CRUD
    print(f"\n🏛️ Testing Ministries CRUD")
    ministry_id = None
    
    # Get existing ministries first
    tester.test_get_ministries()
    
    # Create new ministry
    create_success, ministry_id = tester.test_create_ministry()
    
    if ministry_id:
        # Test get specific ministry
        tester.test_get_ministry_by_id(ministry_id)
        
        # Test update ministry
        tester.test_update_ministry(ministry_id)
    
    # Test News CRUD
    print(f"\n📰 Testing News CRUD")
    news_id = None
    
    # Get existing news
    tester.test_get_news()
    
    # Create news
    create_success, news_id = tester.test_create_news()
    
    if news_id:
        tester.test_get_news_by_id(news_id)
    
    # Test Legislation CRUD  
    print(f"\n⚖️ Testing Legislation CRUD")
    law_id = None
    
    # Get existing legislation
    tester.test_get_legislation()
    
    # Create legislation
    create_success, law_id = tester.test_create_legislation()
    
    if law_id:
        tester.test_get_legislation_by_id(law_id)
    
    # Test Image Upload
    print(f"\n📎 Testing Image Upload")
    tester.test_image_upload()
    
    # Clean up - Delete test items (optional)
    print(f"\n🧹 Cleaning up test data")
    if ministry_id:
        tester.test_delete_ministry(ministry_id)
    if news_id:
        tester.test_delete_news(news_id) 
    if law_id:
        tester.test_delete_legislation(law_id)
    
    # Print final results
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)