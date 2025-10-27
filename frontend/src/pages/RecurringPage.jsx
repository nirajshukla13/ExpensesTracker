import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RecurringPage = ({ user }) => {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchRecurring();
    fetchCategories();
  }, []);

  const fetchRecurring = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recurring`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecurring(response.data);
    } catch (error) {
      toast.error('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/recurring`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Recurring expense added successfully');
      fetchRecurring();
      setDialogOpen(false);
      setFormData({
        category: '',
        amount: '',
        frequency: 'monthly',
        next_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to add recurring expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/recurring/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Recurring expense deleted successfully');
        fetchRecurring();
      } catch (error) {
        toast.error('Failed to delete recurring expense');
      }
    }
  };

  const getFrequencyBadgeColor = (frequency) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-700',
      weekly: 'bg-green-100 text-green-700',
      monthly: 'bg-purple-100 text-purple-700',
      yearly: 'bg-orange-100 text-orange-700'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6" data-testid="recurring-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white dark:text-gray-100" data-testid="recurring-title">Recurring Expenses</h1>
          <p className="text-white/80 dark:text-gray-300">Manage your recurring payments and subscriptions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-purple-600 hover:bg-white/90"
              data-testid="add-recurring-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="recurring-dialog">
            <DialogHeader>
              <DialogTitle>Add Recurring Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  data-testid="recurring-category-select"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  data-testid="recurring-amount-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  data-testid="recurring-frequency-select"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_date">Next Payment Date</Label>
                <Input
                  id="next_date"
                  type="date"
                  data-testid="recurring-next-date-input"
                  value={formData.next_date}
                  onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <select
                  id="payment_method"
                  data-testid="recurring-payment-select"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Digital Wallet">Digital Wallet</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  data-testid="recurring-notes-input"
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" data-testid="save-recurring-button">
                Add Recurring Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recurring List */}
      <Card className="glass border-0" data-testid="recurring-list-card">
        <CardHeader>
          <CardTitle>All Recurring Expenses ({recurring.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : recurring.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recurring expenses found</p>
          ) : (
            <div className="space-y-3">
              {recurring.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
                  data-testid={`recurring-item-${item.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{item.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getFrequencyBadgeColor(item.frequency)}`}>
                        {item.frequency}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.payment_method}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">Next: {item.next_date}</p>
                    </div>
                    {item.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className="text-xl font-bold text-purple-600" data-testid={`recurring-amount-${item.id}`}>
                      {user?.currency} {item.amount}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-recurring-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {recurring.length > 0 && (
        <Card className="glass border-0" data-testid="recurring-summary-card">
          <CardHeader>
            <CardTitle>Monthly Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="monthly-commitment">
              {user?.currency}{' '}
              {recurring
                .filter((item) => item.frequency === 'monthly')
                .reduce((sum, item) => sum + item.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Total monthly recurring expenses
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecurringPage;