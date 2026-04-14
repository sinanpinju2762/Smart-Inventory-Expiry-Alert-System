import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';

const categories = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'];

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({
    name: '', barcode: '', category: 'Other', brand: '', batchNumber: '',
    quantity: '', price: '', manufacturingDate: '', expiryDate: '', store: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data } = await API.get('/stores');
      setStores(data);
      // Auto-select user's store or first store
      if (user?.store?._id) {
        setForm(f => ({ ...f, store: user.store._id }));
      } else if (data.length > 0) {
        setForm(f => ({ ...f, store: data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBarcodeScan = async (code) => {
    setForm(f => ({ ...f, barcode: code }));
    try {
      // Try local database first
      const { data } = await API.get(`/barcode/${code}`);
      if (data.product) {
        setForm(f => ({
          ...f,
          name: data.product.name || f.name,
          brand: data.product.brand || f.brand,
          category: data.product.category || f.category,
          price: data.product.price || f.price
        }));
        toast.success('Product found! Details auto-filled.');
      }
    } catch {
      // Try Open Food Facts API
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          setForm(f => ({
            ...f,
            name: p.product_name || f.name,
            brand: p.brands || f.brand
          }));
          toast.success('Product found online! Some details filled.');
        } else {
          toast('Product not found. Please enter details manually.', { icon: 'i' });
        }
      } catch {
        toast('Could not lookup barcode. Enter details manually.', { icon: 'i' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/products', {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price)
      });

      // Save barcode to local database for future scans
      if (form.barcode) {
        try {
          await API.post('/barcode', {
            barcode: form.barcode,
            name: form.name,
            brand: form.brand,
            category: form.category,
            price: Number(form.price)
          });
        } catch {} // silently fail
      }

      toast.success('Product added successfully!');
      navigate('/inventory');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Add New Product</h1>
        <p>Scan barcode or enter product details manually</p>
      </div>

      {/* Barcode Scanner Toggle */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-outline" onClick={() => setShowScanner(!showScanner)}>
          {showScanner ? 'Hide Scanner' : 'Scan Barcode'}
        </button>
      </div>

      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} />}

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Product Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Amul Milk 500ml" required />
          </div>

          <div className="form-group">
            <label>Barcode</label>
            <input type="text" name="barcode" value={form.barcode} onChange={handleChange} placeholder="Barcode number" />
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g., Amul" />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={form.category} onChange={handleChange} required>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Batch Number</label>
            <input type="text" name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="e.g., BATCH-2026-04" />
          </div>

          <div className="form-group">
            <label>Quantity *</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g., 50" min="1" required />
          </div>

          <div className="form-group">
            <label>Price (per unit) *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g., 25" min="0" step="0.01" required />
          </div>

          <div className="form-group">
            <label>Manufacturing Date</label>
            <input type="date" name="manufacturingDate" value={form.manufacturingDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Expiry Date *</label>
            <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required />
          </div>

          {user?.role === 'admin' && (
            <div className="form-group">
              <label>Store *</label>
              <select name="store" value={form.store} onChange={handleChange} required>
                <option value="">Select Store</option>
                {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary">
            <FiSave /> Add Product
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/inventory')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
