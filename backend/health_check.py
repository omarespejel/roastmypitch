#!/usr/bin/env python3
"""
Health check script for Render deployment verification
"""

import os
import sys
import time

import requests


def check_environment():
    """Check that required environment variables are set"""
    required_vars = [
        "OPENROUTER_API_KEY",
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False

    print("✅ All required environment variables are set")
    return True


def check_api_health(base_url="http://localhost:8000"):
    """Check if the API is responding"""
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("✅ API health check passed")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API health check failed: {str(e)}")
        return False


def main():
    """Main health check function"""
    print("🔍 Running deployment health checks...")

    # Check environment variables
    env_ok = check_environment()

    # Wait a moment for the server to start
    print("⏳ Waiting for server to start...")
    time.sleep(5)

    # Check API health
    api_ok = check_api_health()

    if env_ok and api_ok:
        print("🎉 All health checks passed!")
        sys.exit(0)
    else:
        print("❌ Some health checks failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
