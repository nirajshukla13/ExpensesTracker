from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
import csv
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    currency: str = "USD"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    currency: str = "USD"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    amount: float
    date: str
    payment_method: str
    notes: Optional[str] = ""
    receipt_url: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    date: str
    payment_method: str
    notes: Optional[str] = ""
    receipt_url: Optional[str] = ""

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    icon: str
    color: str
    is_custom: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    month: int
    year: int
    limit: float
    currency: str = "USD"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetCreate(BaseModel):
    month: int
    year: int
    limit: float

class RecurringExpense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    amount: float
    frequency: str  # daily, weekly, monthly, yearly
    next_date: str
    payment_method: str
    notes: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecurringExpenseCreate(BaseModel):
    category: str
    amount: float
    frequency: str
    next_date: str
    payment_method: str
    notes: Optional[str] = ""

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        # PyJWT's base exception is PyJWTError (older code used JWTError)
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=password_hash,
        currency=user.currency
    )
    
    user_dict = new_user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create default categories
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
        category = Category(
            user_id=new_user.id,
            name=cat["name"],
            icon=cat["icon"],
            color=cat["color"],
            is_custom=False
        )
        cat_dict = category.model_dump()
        cat_dict['created_at'] = cat_dict['created_at'].isoformat()
        await db.categories.insert_one(cat_dict)
    
    # Generate token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "currency": new_user.currency
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user["email"],
            "currency": db_user.get("currency", "USD")
        }
    }

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Expense Routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, user_id: str = Depends(get_current_user)):
    new_expense = Expense(user_id=user_id, **expense.model_dump())
    expense_dict = new_expense.model_dump()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    await db.expenses.insert_one(expense_dict)
    return new_expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(user_id: str = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    for expense in expenses:
        if isinstance(expense['created_at'], str):
            expense['created_at'] = datetime.fromisoformat(expense['created_at'])
    return expenses

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id, "user_id": user_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if isinstance(expense['created_at'], str):
        expense['created_at'] = datetime.fromisoformat(expense['created_at'])
    return expense

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_update: ExpenseUpdate, user_id: str = Depends(get_current_user)):
    existing = await db.expenses.find_one({"id": expense_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = {k: v for k, v in expense_update.model_dump().items() if v is not None}
    if update_data:
        await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# Category Routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories(user_id: str = Depends(get_current_user)):
    categories = await db.categories.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, user_id: str = Depends(get_current_user)):
    new_category = Category(user_id=user_id, is_custom=True, **category.model_dump())
    cat_dict = new_category.model_dump()
    cat_dict['created_at'] = cat_dict['created_at'].isoformat()
    await db.categories.insert_one(cat_dict)
    return new_category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user_id: str = Depends(get_current_user)):
    category = await db.categories.find_one({"id": category_id, "user_id": user_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not category.get("is_custom", True):
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
    
    await db.categories.delete_one({"id": category_id})
    return {"message": "Category deleted successfully"}

# Budget Routes
@api_router.post("/budget", response_model=Budget)
async def create_budget(budget: BudgetCreate, user_id: str = Depends(get_current_user)):
    # Get user's currency
    user = await db.users.find_one({"id": user_id})
    currency = user.get("currency", "USD") if user else "USD"
    
    # Check if budget exists for this month
    existing = await db.budgets.find_one({
        "user_id": user_id,
        "month": budget.month,
        "year": budget.year
    })
    
    if existing:
        # Update existing budget
        await db.budgets.update_one(
            {"id": existing["id"]},
            {"$set": {"limit": budget.limit, "currency": currency}}
        )
        existing["limit"] = budget.limit
        existing["currency"] = currency
        if isinstance(existing['created_at'], str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        return existing
    
    new_budget = Budget(user_id=user_id, currency=currency, **budget.model_dump())
    budget_dict = new_budget.model_dump()
    budget_dict['created_at'] = budget_dict['created_at'].isoformat()
    await db.budgets.insert_one(budget_dict)
    return new_budget

@api_router.get("/budget/{month}/{year}", response_model=Budget)
async def get_budget(month: int, year: int, user_id: str = Depends(get_current_user)):
    budget = await db.budgets.find_one({
        "user_id": user_id,
        "month": month,
        "year": year
    }, {"_id": 0})
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    if isinstance(budget['created_at'], str):
        budget['created_at'] = datetime.fromisoformat(budget['created_at'])
    return budget

# Recurring Expenses
@api_router.post("/recurring", response_model=RecurringExpense)
async def create_recurring_expense(recurring: RecurringExpenseCreate, user_id: str = Depends(get_current_user)):
    new_recurring = RecurringExpense(user_id=user_id, **recurring.model_dump())
    recurring_dict = new_recurring.model_dump()
    recurring_dict['created_at'] = recurring_dict['created_at'].isoformat()
    await db.recurring_expenses.insert_one(recurring_dict)
    return new_recurring

@api_router.get("/recurring", response_model=List[RecurringExpense])
async def get_recurring_expenses(user_id: str = Depends(get_current_user)):
    recurring = await db.recurring_expenses.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for rec in recurring:
        if isinstance(rec['created_at'], str):
            rec['created_at'] = datetime.fromisoformat(rec['created_at'])
    return recurring

@api_router.delete("/recurring/{recurring_id}")
async def delete_recurring_expense(recurring_id: str, user_id: str = Depends(get_current_user)):
    result = await db.recurring_expenses.delete_one({"id": recurring_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    return {"message": "Recurring expense deleted successfully"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    
    total_expenses = sum(exp["amount"] for exp in expenses)
    
    # Calculate by category
    by_category = {}
    for exp in expenses:
        cat = exp["category"]
        by_category[cat] = by_category.get(cat, 0) + exp["amount"]
    
    # Calculate by payment method
    by_payment = {}
    for exp in expenses:
        method = exp["payment_method"]
        by_payment[method] = by_payment.get(method, 0) + exp["amount"]
    
    # Calculate monthly trend (last 6 months)
    monthly_trend = {}
    for exp in expenses:
        date_str = exp["date"]
        month_key = date_str[:7]  # YYYY-MM
        monthly_trend[month_key] = monthly_trend.get(month_key, 0) + exp["amount"]
    
    return {
        "total_expenses": total_expenses,
        "by_category": by_category,
        "by_payment_method": by_payment,
        "monthly_trend": monthly_trend,
        "total_transactions": len(expenses)
    }

# Export Routes
@api_router.get("/export/csv")
async def export_csv(user_id: str = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["date", "category", "amount", "payment_method", "notes"])
    writer.writeheader()
    
    for exp in expenses:
        writer.writerow({
            "date": exp["date"],
            "category": exp["category"],
            "amount": exp["amount"],
            "payment_method": exp["payment_method"],
            "notes": exp.get("notes", "")
        })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

@api_router.get("/export/excel")
async def export_excel(user_id: str = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Expenses"
    
    # Headers
    ws.append(["Date", "Category", "Amount", "Payment Method", "Notes"])
    
    # Data
    for exp in expenses:
        ws.append([
            exp["date"],
            exp["category"],
            exp["amount"],
            exp["payment_method"],
            exp.get("notes", "")
        ])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"}
    )

@api_router.get("/export/pdf")
async def export_pdf(user_id: str = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": user_id}, {"_id": 0}).to_list(10000)
    user = await db.users.find_one({"id": user_id})
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, f"Expense Report - {user.get('username', 'User')}")
    
    # Headers
    y = height - 100
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Date")
    p.drawString(150, y, "Category")
    p.drawString(250, y, "Amount")
    p.drawString(350, y, "Payment")
    
    # Data
    p.setFont("Helvetica", 9)
    y -= 20
    
    for exp in expenses:
        if y < 50:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 9)
        
        p.drawString(50, y, exp["date"][:10])
        p.drawString(150, y, exp["category"][:15])
        p.drawString(250, y, f"${exp['amount']:.2f}")
        p.drawString(350, y, exp["payment_method"][:15])
        y -= 15
    
    # Total
    total = sum(exp["amount"] for exp in expenses)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(250, y - 20, f"Total: ${total:.2f}")
    
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"}
    )

# Include router
app.include_router(api_router)

# Dev-only: token endpoint (enabled via DEV_TOKEN_ENDPOINT env var)
if os.environ.get("DEV_TOKEN_ENDPOINT", "false").lower() in ("1", "true", "yes"):
    @api_router.get("/dev/token")
    async def dev_token(request: Request):
        # Only allow localhost requests
        client_host = request.client.host if request.client else None
        if client_host not in ("127.0.0.1", "::1", "localhost"):
            raise HTTPException(status_code=403, detail="Forbidden")

        # create or find dev user
        email = os.environ.get("DEV_USER_EMAIL", "dev@example.com")
        username = os.environ.get("DEV_USER_NAME", "devuser")
        password = os.environ.get("DEV_USER_PASSWORD", "password123")

        existing = await db.users.find_one({"email": email})
        if existing:
            user_id = existing["id"]
        else:
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "username": username,
                "email": email,
                "password_hash": get_password_hash(password),
                "currency": "USD",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.users.insert_one(user_doc)
            # insert default categories for dev user
            default_categories = [
                {"name": "Food", "icon": "Utensils", "color": "#FF6B6B"},
                {"name": "Transport", "icon": "Car", "color": "#4ECDC4"},
                {"name": "Bills", "icon": "FileText", "color": "#45B7D1"},
                {"name": "Shopping", "icon": "ShoppingBag", "color": "#FFA07A"},
            ]
            for cat in default_categories:
                cat_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": cat["name"],
                    "icon": cat["icon"],
                    "color": cat["color"],
                    "is_custom": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.categories.insert_one(cat_doc)

        token = create_access_token({"sub": user_id})
        return {"access_token": token}

# Parse CORS origins from env and normalize values (trim whitespace and quotes)
cors_env = os.environ.get('CORS_ORIGINS', '*')
# Split on comma, strip spaces and surrounding quotes, and ignore empty entries
cors_origins = [o.strip().strip('"').strip("'") for o in cors_env.split(',') if o.strip()]
# If the env was set to a single '*' (or empty after parsing) use wildcard
if len(cors_origins) == 0:
    cors_origins = ['*']
if len(cors_origins) == 1 and cors_origins[0] == '*':
    # Allow all origins
    allow_origins_setting = ['*']
else:
    allow_origins_setting = cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins_setting,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()