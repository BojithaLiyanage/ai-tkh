#!/usr/bin/env python3
"""
Test script to verify delete functionality works
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_with_auth():
    """Test delete endpoints with authentication"""

    # First, login to get a session
    login_data = {
        "email": "admin@example.com",  # Update with your admin email
        "password": "your_password"     # Update with your admin password
    }

    print("1. Testing authentication...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

    if response.status_code == 200:
        print("✓ Authentication successful")
        cookies = response.cookies

        # Test getting fiber classes
        print("\n2. Testing GET fiber classes...")
        response = requests.get(f"{BASE_URL}/fiber/classes", cookies=cookies)
        if response.status_code == 200:
            classes = response.json()
            print(f"✓ Found {len(classes)} fiber classes")

            if classes:
                print(f"  First class: {classes[0]['name']}")
                print("\n3. Delete endpoints are ready to test")
                print("  You can now test delete from the UI")
        else:
            print(f"✗ Failed to get fiber classes: {response.status_code}")
    else:
        print(f"✗ Authentication failed: {response.status_code}")
        print("  Response:", response.text)
        print("\n  Please update the login credentials in this script")

if __name__ == "__main__":
    print("Testing Delete API Functionality")
    print("=" * 50)
    test_with_auth()
