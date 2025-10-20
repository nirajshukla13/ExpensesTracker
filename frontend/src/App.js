import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ExpensesPage from "./pages/ExpensesPage";
import CategoriesPage from "./pages/CategoriesPage";
import BudgetPage from "./pages/BudgetPage";
import RecurringPage from "./pages/RecurringPage";
import ReportsPage from "./pages/ReportsPage";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/sonner";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              user ? <Navigate to="/dashboard" /> : <AuthPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Navigate to="/dashboard" />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/expenses"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <ExpensesPage user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/categories"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <CategoriesPage user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/budget"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <BudgetPage user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/recurring"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <RecurringPage user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/reports"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <ReportsPage user={user} />
                </Layout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;