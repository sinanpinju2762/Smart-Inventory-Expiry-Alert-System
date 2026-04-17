import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'];

export default function Inventory() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [storeFilter, setStoreFilter] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProducts();
    if (user?.role === 'admin') fetchStores();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products');
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data } = await API.get('/stores');
      setStores(data);
    } catch {}
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEditSave = async () => {
    try {
      const { data } = await API.put(`/products/${editProduct._id}`, {
        ...editForm,
        quantity: Number(editForm.quantity),
        price: Number(editForm.price)
      });
      setProducts(products.map(p => p._id === data._id ? data : p));
      setEditProduct(null);
      toast.success('Product updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      expiryDate: product.expiryDate.split('T')[0],
      batchNumber: product.batchNumber || ''
    });
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchStore = !storeFilter || String(p.store?._id || p.store) === storeFilter;
    return matchSearch && matchCategory && matchStatus && matchStore;
  });

  if (loading) return <div className="empty-state"><h3>Loading inventory...</h3></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Inventory</h1>
          <p>{products.length} products in stock</p>
        </div>
        <Link to="/add-product" className="btn btn-primary"><FiPlus /> Add Product</Link>
      </div>

      {/* Filters */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-filters">
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: 'var(--gray-400)' }} />
              <input
                className="search-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="safe">Safe</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            {user?.role === 'admin' && stores.length > 0 && (
              <select className="filter-select" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                <option value="">All Stores</option>
                {stores.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your filters or add a new product.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                {user?.role === 'admin' && <th>Store</th>}
                <th>Qty</th>
                <th>Price</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const days = p.daysUntilExpiry;
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.brand}</div>}
                    </td>
                    <td>{p.category}</td>
                    {user?.role === 'admin' && (
                      <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        {p.store?.name || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                    )}
                    <td>{p.quantity}</td>
                    <td>Rs.{p.price}</td>
                    <td>{new Date(p.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600, color: days < 0 ? 'var(--danger)' : days <= 3 ? '#b45309' : days <= 7 ? 'var(--warning)' : 'var(--success)' }}>
                      {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                    </td>
                    <td><span className={`badge ${p.status}`}>{p.status === 'expiring_soon' ? 'Expiring' : p.status === 'expired' ? 'Expired' : 'Safe'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><FiEdit2 /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id, p.name)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                  {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" value={editForm.expiryDate} onChange={e => setEditForm({ ...editForm, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
