import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const iconOptions = [
  'Utensils', 'Car', 'FileText', 'ShoppingBag', 'Music', 'Heart', 'Home', 'Plane',
  'Coffee', 'Book', 'Shirt', 'Smartphone', 'Zap', 'Droplet', 'Wifi'
];

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#DDA15E', '#BC6C25', '#606C38',
  '#6A4C93', '#1982C4', '#8AC926', '#FF595E', '#FFCA3A'
];

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Tag',
    color: '#FF6B6B'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/categories`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category added successfully');
      fetchCategories();
      setDialogOpen(false);
      setFormData({ name: '', icon: 'Tag', color: '#FF6B6B' });
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleDelete = async (id, isCustom) => {
    if (!isCustom) {
      toast.error('Cannot delete default categories');
      return;
    }
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const renderIcon = (iconName, color) => {
    const Icon = Icons[iconName] || Icons.Tag;
    return <Icon className="w-6 h-6" style={{ color }} />;
  };

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white dark:text-gray-100" data-testid="categories-title">Categories</h1>
          <p className="text-white/80">Manage your expense categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-white text-purple-600 hover:bg-white/90"
              data-testid="add-category-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="category-dialog">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  data-testid="category-name-input"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((iconName) => {
                    const Icon = Icons[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.icon === iconName
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`icon-option-${iconName}`}
                      >
                        <Icon className="w-5 h-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-purple-600 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-option-${color}`}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" data-testid="save-category-button">
                Add Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-white/80">No categories found</p>
          </div>
        ) : (
          categories.map((category) => (
            <Card
              key={category.id}
              className="glass border-0 hover:scale-105 transition-transform"
              data-testid={`category-card-${category.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {renderIcon(category.icon, category.color)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-xs text-gray-500">
                        {category.is_custom ? 'Custom' : 'Default'}
                      </p>
                    </div>
                  </div>
                  {category.is_custom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.is_custom)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;