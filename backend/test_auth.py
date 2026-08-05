import os
from dotenv import load_dotenv
from supabase import create_client
from database.supabase_db import get_user_from_token

def test_supabase_auth():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = create_client(url, key)

    print("Signing up test user...")
    test_email = "test@legal.local"
    test_password = "password1234"
    try:
        auth_response = client.auth.sign_up({"email": test_email, "password": test_password})
        token = auth_response.session.access_token
        print("Got token:", token[:20] + "...")
        
        user_info = get_user_from_token(token)
        print("Parsed User from backend logic:", user_info)
    except Exception as e:
        print("Error:", str(e))
        
        # Try signing in if already exists
        try:
            print("Trying to sign in instead...")
            auth_response = client.auth.sign_in_with_password({"email": test_email, "password": test_password})
            token = auth_response.session.access_token
            print("Got token:", token[:20] + "...")
            
            user_info = get_user_from_token(token)
            print("Parsed User from backend logic:", user_info)
        except Exception as e2:
            print("Sign in error:", str(e2))

if __name__ == "__main__":
    test_supabase_auth()
