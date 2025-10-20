import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { AlertCircle, TrendingUp } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BudgetPage = ({ user }) => {
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    limit: ''
  });

  useEffect(() => {
    fetchBudget();
    fetchExpenses();
  }, []);

  const fetchBudget = async () => {
    try {
      const token = localStorage.getItem('token');
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const response = await axios.get(`${API}/budget/${month}/${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudget(response.data);
      setFormData({
        month: response.data.month,
        year: response.data.year,
        limit: response.data.limit
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load budget');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to load expenses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/budget`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Budget updated successfully');
      fetchBudget();
    } catch (error) {
      toast.error('Failed to update budget');
    }
  };

  const calculateMonthlySpending = () => {
    const currentMonth = formData.month;
    const currentYear = formData.year;
    return expenses
      .filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const monthlySpent = calculateMonthlySpending();
  const budgetLimit = parseFloat(formData.limit) || 0;
  const percentage = budgetLimit > 0 ? (monthlySpent / budgetLimit) * 100 : 0;
  const remaining = budgetLimit - monthlySpent;
  const isOverBudget = monthlySpent > budgetLimit && budgetLimit > 0;

  return (
    <div className="space-y-6" data-testid="budget-page">
      <div>
        <h1 className="text-4xl font-bold text-white" data-testid="budget-title">Budget</h1>
        <p className="text-white/80">Set and track your monthly budget</p>
      </div>

      {/* Budget Form */}
      <Card className="glass border-0" data-testid="budget-form-card">
        <CardHeader>
          <CardTitle>Set Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <select
                  id="month"
                  data-testid="budget-month-select"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  data-testid="budget-year-input"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="2020"
                  max="2100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Budget Limit ({user?.currency})</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  data-testid="budget-limit-input"
                  placeholder="Enter budget limit"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" data-testid="save-budget-button">
              Save Budget
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {budgetLimit > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-0" data-testid="budget-limit-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Budget Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="budget-limit-amount">
                {user?.currency} {budgetLimit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0" data-testid="spent-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="spent-amount">
                {user?.currency} {monthlySpent.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0" data-testid="remaining-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}
                data-testid="remaining-amount"
              >
                {user?.currency} {remaining.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {budgetLimit > 0 && (
        <Card className="glass border-0" data-testid="progress-card">
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Spending</span>
                <span className="text-sm font-medium" data-testid="progress-percentage">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className="h-3"
                data-testid="budget-progress-bar"
              />
            </div>

            {isOverBudget && (
              <div
                className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                data-testid="over-budget-alert"
              >
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Budget Exceeded!</h4>
                  <p className="text-sm text-red-700">
                    You've exceeded your budget by {user?.currency} {Math.abs(remaining).toFixed(2)}.
                    Consider reducing expenses or increasing your budget.
                  </p>
                </div>
              </div>
            )}

            {!isOverBudget && percentage > 80 && (
              <div
                className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                data-testid="budget-warning"
              >
                <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Almost There!</h4>
                  <p className="text-sm text-yellow-700">
                    You've used {percentage.toFixed(1)}% of your budget. Be mindful of your spending.
                  </p>
                </div>
              </div>
            )}

            {percentage <= 80 && budgetLimit > 0 && (
              <div
                className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                data-testid="budget-good"
              >
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">On Track!</h4>
                  <p className="text-sm text-green-700">
                    You're doing great! Keep monitoring your expenses to stay within budget.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetPage;