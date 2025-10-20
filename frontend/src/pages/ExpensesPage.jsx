import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mic, MicOff } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExpensesPage = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: ''
  });
  const [filters, setFilters] = useState({
    category: '',
    payment_method: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      toast.error('Failed to load expenses');
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
      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Expense updated successfully');
      } else {
        await axios.post(`${API}/expenses`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Expense added successfully');
      }
      fetchExpenses();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: ''
    });
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      payment_method: expense.payment_method,
      notes: expense.notes || ''
    });
    setDialogOpen(true);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Listening... Speak now!');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData({ ...formData, notes: transcript });
      toast.success('Voice input captured!');
    };

    recognition.onerror = () => {
      toast.error('Voice input failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.category && expense.category !== filters.category) return false;
    if (filters.payment_method && expense.payment_method !== filters.payment_method) return false;
    if (filters.date_from && expense.date < filters.date_from) return false;
    if (filters.date_to && expense.date > filters.date_to) return false;
    return true;
  });

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white" data-testid="expenses-title">Expenses</h1>
          <p className="text-white/80">Track and manage your expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-purple-600 hover:bg-white/90"
              data-testid="add-expense-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="expense-dialog">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  data-testid="expense-category-select"
                  className="w-full px-3 py-2 border rounded-md"
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
                  data-testid="expense-amount-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  data-testid="expense-date-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <select
                  id="payment_method"
                  data-testid="expense-payment-select"
                  className="w-full px-3 py-2 border rounded-md"
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="notes">Notes</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={startVoiceInput}
                    disabled={isListening}
                    data-testid="voice-input-button"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                <Input
                  id="notes"
                  data-testid="expense-notes-input"
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" data-testid="save-expense-button">
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="glass border-0" data-testid="filters-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full px-3 py-2 border rounded-md mt-1"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                data-testid="filter-category-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <select
                className="w-full px-3 py-2 border rounded-md mt-1"
                value={filters.payment_method}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                data-testid="filter-payment-select"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                data-testid="filter-date-from-input"
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                data-testid="filter-date-to-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="glass border-0" data-testid="expenses-list-card">
        <CardHeader>
          <CardTitle>All Expenses ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No expenses found</p>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{expense.category}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {expense.payment_method}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{expense.date}</p>
                    {expense.notes && <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className="text-xl font-bold text-purple-600" data-testid={`expense-amount-${expense.id}`}>
                      {user?.currency} {expense.amount}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        data-testid={`edit-expense-${expense.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-expense-${expense.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;