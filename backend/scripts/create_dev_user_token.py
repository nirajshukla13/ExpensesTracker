from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import pymongo
import jwt

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / 'backend' / '.env' if (ROOT / 'backend' / '.env').exists() else ROOT / '.env')
# The repo's .env is located in backend/.env
load_dotenv(ROOT / '.env')
# Fallback to backend/.env
load_dotenv(ROOT / 'backend' / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'expense_tracker_db')
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

client = pymongo.MongoClient(MONGO_URL)
db = client[DB_NAME]

email = 'dev@example.com'
username = 'devuser'
password = 'password123'

# Check existing user
existing = db.users.find_one({'email': email})
if existing:
    user_id = existing['id']
    print('User already exists:', user_id)
else:
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'username': username,
        'email': email,
        'password_hash': pwd_context.hash(password),
        'currency': 'USD',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(user_doc)
    # create default categories
    default_categories = [
        {"name": "Food", "icon": "Utensils", "color": "#FF6B6B"},
        {"name": "Transport", "icon": "Car", "color": "#4ECDC4"},
        {"name": "Bills", "icon": "FileText", "color": "#45B7D1"},
        {"name": "Shopping", "icon": "ShoppingBag", "color": "#FFA07A"},
        {"name": "Entertainment", "icon": "Music", "color": "#DDA15E"},
        {"name": "Health", "icon": "Heart", "color": "#BC6C25"},
        {"name": "Other", "icon": "MoreHorizontal", "color": "#606C38"}
    ]
    for cat in default_categories:
        cat_doc = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'name': cat['name'],
            'icon': cat['icon'],
            'color': cat['color'],
            'is_custom': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        db.categories.insert_one(cat_doc)
    print('Created user:', user_id)

# Create token
to_encode = {"sub": user_id}
expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode.update({"exp": expire})
access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
print(access_token)

client.close()
