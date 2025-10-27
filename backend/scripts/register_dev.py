import requests
import sys

BASE = 'http://127.0.0.1:8000/api'
DEV_USER = {
    'username': 'devuser',
    'email': 'dev@example.com',
    'password': 'password123',
    'currency': 'USD'
}

try:
    r = requests.post(f'{BASE}/auth/register', json=DEV_USER, timeout=10)
    if r.status_code == 200:
        data = r.json()
        print('REGISTERED')
        print(data.get('access_token'))
        sys.exit(0)
    else:
        # If already registered, try login
        print('Register returned', r.status_code, r.text)
        if r.status_code == 400:
            # try login
            login_payload = {'email': DEV_USER['email'], 'password': DEV_USER['password']}
            r2 = requests.post(f'{BASE}/auth/login', json=login_payload, timeout=10)
            if r2.status_code == 200:
                print('LOGGED_IN')
                print(r2.json().get('access_token'))
                sys.exit(0)
            else:
                print('Login failed', r2.status_code, r2.text)
                sys.exit(2)
        else:
            sys.exit(3)
except Exception as e:
    print('Error:', str(e))
    sys.exit(1)
