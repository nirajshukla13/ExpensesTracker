# Expense Tracker

Full-stack expense tracking application with React frontend and FastAPI backend.

## 🚀 Quick Setup (For New Users)

### Step 1: Install Dependencies

```powershell
# Install both frontend and backend dependencies at once
npm run install:frontend
npm run install:backend
```

Or install them separately:

**Frontend:**
```powershell
cd frontend
npm install --legacy-peer-deps
```

**Backend:**
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\create_venv.ps1
```

### Step 2: Configure Backend

Create a `backend/.env` file with your MongoDB connection:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=expense_tracker
JWT_SECRET_KEY=your-secret-key-here-change-this
CORS_ORIGINS=*
DEV_TOKEN_ENDPOINT=true
```

### Step 3: Start the Servers

**Start Backend** (in one terminal):
```powershell
npm run start:backend
```
Backend runs on: `http://localhost:8000`

**Start Frontend** (in another terminal):
```powershell
npm start
```
Frontend runs on: `http://localhost:3000`

That's it! 🎉 Open your browser to `http://localhost:3000`

---

## 📖 Detailed Instructions

### Frontend Setup Options

**Option 1: Quick start from root**
```powershell
npm run install:frontend   # Install dependencies
npm start                  # Start dev server
```

**Option 2: Work in frontend folder**
```powershell
cd frontend
npm install --legacy-peer-deps
npm start
# or use: npm run dev
```

### Backend Setup Options

**Option 1: Quick start from root (recommended)**
```powershell
npm run install:backend    # Setup Python venv + install packages
npm run start:backend      # Start server on port 8000
```

**Option 2: Using helper scripts**
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\create_venv.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start_backend.ps1
```

**Option 3: Manual Python setup**
```powershell
cd backend

# Create virtual environment (one time only)
python -m venv ..\venv
..\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn server:app --reload --port 8000
```

---

## 📦 Available Scripts

### Root Level Commands
- `npm run install:frontend` - Install frontend dependencies
- `npm run install:backend` - Setup Python environment and install backend dependencies
- `npm start` - Start frontend dev server
- `npm run dev` - Start frontend dev server (alias)
- `npm run start:backend` - Start backend server
- `npm run build` - Build frontend for production

### Frontend Commands (from `frontend/` folder)
- `npm start` - Start development server
- `npm run dev` - Start development server (alias)
- `npm run build` - Build for production
- `npm test` - Run tests

---

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Tailwind CSS (with dark mode support)
- Radix UI Components
- Recharts for charts
- Axios for API calls
- React Router for navigation

**Backend:**
- FastAPI (Python web framework)
- MongoDB with Motor (async driver)
- PyJWT for authentication
- Uvicorn ASGI server
- Passlib for password hashing

---

## 📝 Prerequisites

- **Node.js** 14+ and npm
- **Python** 3.8 or higher
- **MongoDB** (local installation or cloud instance like MongoDB Atlas)

---

## 🔧 Configuration Files

**Frontend** (`frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_DEV_TOKEN=true
```

**Backend** (`backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=expense_tracker
JWT_SECRET_KEY=your-secret-key-change-this-in-production
CORS_ORIGINS=*
DEV_TOKEN_ENDPOINT=true
```

---

## 🎨 Features

- ✅ User Authentication (Login/Register)
- ✅ Expense Tracking with Categories
- ✅ Budget Management
- ✅ Recurring Expenses
- ✅ Reports & Analytics
- ✅ Dark Mode Support
- ✅ Export to CSV/PDF
- ✅ Responsive Design
