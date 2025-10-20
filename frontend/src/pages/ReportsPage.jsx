import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReportsPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `expenses.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Exported to ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error(`Failed to export to ${format.toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="text-4xl font-bold text-white" data-testid="reports-title">Reports & Export</h1>
        <p className="text-white/80">Generate and download financial reports</p>
      </div>

      {/* Export Options */}
      <Card className="glass border-0" data-testid="export-options-card">
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExport('csv')}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-50"
              data-testid="export-csv-button"
            >
              <FileText className="w-8 h-8 text-green-600" />
              <span className="font-semibold">Export to CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-50"
              data-testid="export-excel-button"
            >
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <span className="font-semibold">Export to Excel</span>
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-50"
              data-testid="export-pdf-button"
            >
              <FilePdf className="w-8 h-8 text-red-600" />
              <span className="font-semibold">Export to PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-0" data-testid="report-total-expenses">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.currency} {stats?.total_expenses?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0" data-testid="report-total-transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_transactions || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass border-0" data-testid="report-categories-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats?.by_category || {}).length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0" data-testid="report-payment-methods">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats?.by_payment_method || {}).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="glass border-0" data-testid="category-breakdown-card">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats?.by_category || {})
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => {
                const percentage = ((amount / stats?.total_expenses) * 100).toFixed(1);
                return (
                  <div key={category} className="space-y-1" data-testid={`category-breakdown-${category}`}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-gray-600">
                        {user?.currency} {amount.toFixed(2)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Breakdown */}
      <Card className="glass border-0" data-testid="payment-breakdown-card">
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats?.by_payment_method || {})
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => {
                const percentage = ((amount / stats?.total_expenses) * 100).toFixed(1);
                return (
                  <div key={method} className="space-y-1" data-testid={`payment-breakdown-${method}`}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{method}</span>
                      <span className="text-gray-600">
                        {user?.currency} {amount.toFixed(2)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;