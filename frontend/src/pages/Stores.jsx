import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiUser, FiUsers, FiPackage, FiAlertTriangle, FiDollarSign, FiX, FiMail, FiSearch, FiShield, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../api/axios';

const allCategories = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'];

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', manager: '' });
  const [detailModal, setDetailModal] = useState(null);

  // Employee editing
  const [editingUser, setEditingUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserCategories, setEditUserCategories] = useState([]);

  // Product editing
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({});
  const [productSearch, setProductSearch] = useState('');

  // Add product
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductForm, setAddProductForm] = useState({ name: '', category: 'Dairy', quantity: '', price: '', expiryDate: '', brand: '', barcode: '', batchNumber: '' });

  // Add employee
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  // Store table search
  const [storeSearch, setStoreSearch] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data } = await API.get('/stores/summary');
      setStores(data);
    } catch (err) {
      try {
        const { data } = await API.get('/stores');
        setStores(data);
      } catch {
        toast.error('Failed to load stores');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStore) {
        await API.put(`/stores/${editStore._id}`, form);
        toast.success('Store updated');
      } else {
        await API.post('/stores', form);
        toast.success('Store created');
      }
      closeModal();
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save store');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await API.delete(`/stores/${id}`);
      setStores(stores.filter(s => s._id !== id));
      toast.success('Store deactivated');
    } catch {
      toast.error('Failed to deactivate store');
    }
  };

  const openEdit = (store) => {
    setEditStore(store);
    setForm({ name: store.name, address: store.address, phone: store.phone || '', manager: store.manager || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditStore(null);
    setForm({ name: '', address: '', phone: '', manager: '' });
  };

  const openDetail = async (type, store) => {
    setEditingUser(null);
    setEditingProduct(null);
    setAddingProduct(false);
    setAddingEmployee(false);
    setProductSearch('');
    setDetailModal({ type, store, data: null, loading: true });

    try {
      let data;
      if (type === 'manager') {
        data = { name: store.managerName, email: store.managerEmail };
      } else if (type === 'employees') {
        const res = await API.get('/auth/users');
        data = res.data.filter(u => String(u.store?._id) === String(store._id));
      } else if (type === 'products') {
        const res = await API.get('/products');
        data = res.data.filter(p => String(p.store?._id || p.store) === String(store._id));
      } else if (type === 'expiring') {
        const res = await API.get('/products');
        data = res.data.filter(p =>
          String(p.store?._id || p.store) === String(store._id) &&
          (p.status === 'expiring_soon' || p.status === 'expired')
        );
      }
      setDetailModal({ type, store, data, loading: false });
    } catch (err) {
      toast.error('Failed to load details');
      setDetailModal(null);
    }
  };

  // ---- Employee Edit Handlers ----
  const startEditUser = (user) => {
    setEditingUser(user);
    setEditUserRole(user.role);
    setEditUserCategories(user.assignedCategories || []);
  };

  const handleSaveUser = async () => {
    try {
      await API.put(`/auth/users/${editingUser._id}/role`, {
        role: editUserRole,
        store: detailModal.store._id
      });
      if (editUserRole === 'staff') {
        try {
          await API.put(`/auth/team/${editingUser._id}/assign`, { categories: editUserCategories });
        } catch {}
      }
      toast.success(`${editingUser.name} updated`);
      setEditingUser(null);
      openDetail('employees', detailModal.store);
      fetchStores();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const toggleCategory = (cat) => {
    setEditUserCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ---- Product Edit Handlers ----
  const startEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      expiryDate: product.expiryDate.split('T')[0]
    });
  };

  const handleSaveProduct = async () => {
    try {
      await API.put(`/products/${editingProduct._id}`, {
        ...editProductForm,
        quantity: Number(editProductForm.quantity),
        price: Number(editProductForm.price)
      });
      toast.success('Product updated');
      setEditingProduct(null);
      openDetail(detailModal.type, detailModal.store);
      fetchStores();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/products/${product._id}`);
      toast.success('Product deleted');
      // Remove from local data
      setDetailModal(prev => ({
        ...prev,
        data: prev.data.filter(p => p._id !== product._id)
      }));
      fetchStores();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ---- Add Employee Handler ----
  const handleAddEmployee = async () => {
    try {
      if (!addEmployeeForm.name || !addEmployeeForm.email || !addEmployeeForm.password) {
        return toast.error('Please fill name, email & password');
      }
      // Step 1: Register the user (they'll be created as 'staff' by default)
      const registerRes = await API.post('/auth/register', {
        name: addEmployeeForm.name,
        email: addEmployeeForm.email,
        password: addEmployeeForm.password,
        store: detailModal.store._id
      });
      const newUserId = registerRes.data._id;

      // Step 2: Update role & store assignment
      await API.put(`/auth/users/${newUserId}/role`, {
        role: addEmployeeForm.role,
        store: detailModal.store._id
      });

      toast.success(`${addEmployeeForm.name} added as ${addEmployeeForm.role}!`);
      setAddingEmployee(false);
      setAddEmployeeForm({ name: '', email: '', password: '', role: 'staff' });
      openDetail('employees', detailModal.store);
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    }
  };

  // ---- Add Product Handler ----
  const handleAddProduct = async () => {
    try {
      if (!addProductForm.name || !addProductForm.quantity || !addProductForm.price || !addProductForm.expiryDate) {
        return toast.error('Please fill all required fields');
      }
      await API.post('/products', {
        ...addProductForm,
        quantity: Number(addProductForm.quantity),
        price: Number(addProductForm.price),
        store: detailModal.store._id
      });
      toast.success('Product added!');
      setAddingProduct(false);
      setAddProductForm({ name: '', category: 'Dairy', quantity: '', price: '', expiryDate: '', brand: '', barcode: '', batchNumber: '' });
      openDetail('products', detailModal.store);
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  // ---- Badges ----
  const getRoleBadge = (role) => {
    const styles = {
      admin: { bg: '#dcfce7', color: '#16a34a' },
      manager: { bg: '#fef3c7', color: '#b45309' },
      staff: { bg: '#dbeafe', color: '#2563eb' }
    };
    const s = styles[role] || styles.staff;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: s.bg, color: s.color
      }}>
        <FiShield size={11} />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'expired') return <span className="badge expired">Expired</span>;
    if (status === 'expiring_soon') return <span className="badge expiring_soon">Expiring</span>;
    return <span className="badge safe">Safe</span>;
  };

  // ---- Detail Popup Content ----
  const renderDetailContent = () => {
    if (!detailModal) return null;
    const { type, store, data, loading: isLoading } = detailModal;

    if (isLoading) return (
      <div className="emp-loading">
        <div className="al-loading-spinner" />
        <p>Loading...</p>
      </div>
    );

    // ===== MANAGER =====
    if (type === 'manager') {
      if (!data.name || data.name === 'Not assigned') {
        return (
          <div className="emp-empty">
            <div className="emp-empty-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <FiUser size={32} />
            </div>
            <h3>No Manager Assigned</h3>
            <p>Assign a manager from the Employees section.</p>
          </div>
        );
      }
      return (
        <div className="emp-manager-card">
          <div className="emp-mgr-avatar">
            {data.name.charAt(0).toUpperCase()}
          </div>
          <div className="emp-mgr-info">
            <div className="emp-mgr-name">{data.name}</div>
            <div className="emp-mgr-email"><FiMail size={13} /> {data.email}</div>
            <div style={{ marginTop: 8 }}>{getRoleBadge('manager')}</div>
          </div>
          <div className="emp-mgr-badge">
            <FiShield size={16} />
            <span>Store Manager</span>
          </div>
        </div>
      );
    }

    // ===== EMPLOYEES =====
    if (type === 'employees') {
      const staffCount = (data || []).filter(u => u.role === 'staff').length;
      const mgrCount = (data || []).filter(u => u.role === 'manager').length;

      const addEmployeeFormUI = (
        <>
          {/* Summary + Add Button */}
          <div className="emp-toolbar">
            <div className="emp-summary-pills">
              <span className="emp-pill"><FiUsers size={13} /> {(data || []).length} total</span>
              {mgrCount > 0 && <span className="emp-pill emp-pill-amber">{mgrCount} manager{mgrCount > 1 && 's'}</span>}
              {staffCount > 0 && <span className="emp-pill emp-pill-blue">{staffCount} staff</span>}
            </div>
            {!addingEmployee && (
              <button className="emp-add-btn" onClick={() => { setAddingEmployee(true); setEditingUser(null); }}>
                <FiPlus size={14} /> Add Employee
              </button>
            )}
          </div>

          {/* Add Employee Form */}
          {addingEmployee && (
            <div className="emp-form-card emp-form-add">
              <div className="emp-form-head">
                <div className="emp-form-title">
                  <div className="emp-form-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
                    <FiPlus size={16} />
                  </div>
                  <div>
                    <h4>Add New Employee</h4>
                    <p>to {detailModal.store.name}</p>
                  </div>
                </div>
                <button className="emp-form-close" onClick={() => setAddingEmployee(false)}>
                  <FiX size={16} />
                </button>
              </div>
              <div className="emp-form-grid">
                <div className="emp-field">
                  <label>Full Name <span>*</span></label>
                  <input type="text" value={addEmployeeForm.name} onChange={e => setAddEmployeeForm({ ...addEmployeeForm, name: e.target.value })} placeholder="e.g., Ravi Kumar" />
                </div>
                <div className="emp-field">
                  <label>Email <span>*</span></label>
                  <input type="email" value={addEmployeeForm.email} onChange={e => setAddEmployeeForm({ ...addEmployeeForm, email: e.target.value })} placeholder="e.g., ravi@store.com" />
                </div>
                <div className="emp-field">
                  <label>Password <span>*</span></label>
                  <input type="password" value={addEmployeeForm.password} onChange={e => setAddEmployeeForm({ ...addEmployeeForm, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="emp-field">
                  <label>Role <span>*</span></label>
                  <select value={addEmployeeForm.role} onChange={e => setAddEmployeeForm({ ...addEmployeeForm, role: e.target.value })}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="emp-form-actions">
                <button className="emp-btn-cancel" onClick={() => setAddingEmployee(false)}>Cancel</button>
                <button className="emp-btn-save" onClick={handleAddEmployee}>
                  <FiPlus size={14} /> Create Employee
                </button>
              </div>
            </div>
          )}
        </>
      );

      if (!data || data.length === 0) {
        return (
          <div>
            {addEmployeeFormUI}
            {!addingEmployee && (
              <div className="emp-empty">
                <div className="emp-empty-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
                  <FiUsers size={32} />
                </div>
                <h3>No Employees Yet</h3>
                <p>Click "Add Employee" to add the first person to this store.</p>
              </div>
            )}
          </div>
        );
      }
      return (
        <div>
          {addEmployeeFormUI}

          {/* Edit User Form */}
          {editingUser && (
            <div className="emp-form-card emp-form-edit">
              <div className="emp-form-head">
                <div className="emp-form-title">
                  <div className="emp-form-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <FiEdit2 size={14} />
                  </div>
                  <div>
                    <h4>Editing {editingUser.name}</h4>
                    <p>Update role & assigned categories</p>
                  </div>
                </div>
                <button className="emp-form-close" onClick={() => setEditingUser(null)}>
                  <FiX size={16} />
                </button>
              </div>
              <div className="emp-edit-body">
                <div className="emp-field">
                  <label>Role</label>
                  <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                {editUserRole === 'staff' && (
                  <div className="emp-field">
                    <label>Assigned Categories <span className="emp-cat-count">({editUserCategories.length} selected)</span></label>
                    <div className="emp-cat-grid">
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          className={`emp-cat-chip ${editUserCategories.includes(cat) ? 'emp-cat-active' : ''}`}
                          onClick={() => toggleCategory(cat)}
                        >
                          {editUserCategories.includes(cat) && <FiCheck size={12} />}
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="emp-form-actions">
                <button className="emp-btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                <button className="emp-btn-save" onClick={handleSaveUser}>
                  <FiCheck size={14} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Employee Cards */}
          <div className="emp-list">
            {data.map(u => (
              <div key={u._id} className={`emp-card ${editingUser?._id === u._id ? 'emp-card-editing' : ''}`}>
                <div className="emp-card-left">
                  <div className="emp-avatar" style={{
                    background: u.role === 'manager'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #00897b, #004d40)'
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="emp-card-info">
                    <div className="emp-card-name">{u.name}</div>
                    <div className="emp-card-email"><FiMail size={12} /> {u.email}</div>
                  </div>
                </div>
                <div className="emp-card-center">
                  {getRoleBadge(u.role)}
                </div>
                <div className="emp-card-cats">
                  {u.assignedCategories && u.assignedCategories.length > 0 ? (
                    <div className="emp-cat-tags">
                      {u.assignedCategories.slice(0, 3).map(cat => (
                        <span key={cat} className="emp-cat-tag">{cat}</span>
                      ))}
                      {u.assignedCategories.length > 3 && (
                        <span className="emp-cat-more">+{u.assignedCategories.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="emp-no-cats">—</span>
                  )}
                </div>
                <div className="emp-card-actions">
                  <button className="emp-edit-btn" onClick={() => startEditUser(u)}>
                    <FiEdit2 size={13} /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ===== PRODUCTS =====
    if (type === 'products') {
      const searchedProducts = (data || []).filter(p =>
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
      );
      const totalValue = (data || []).reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const safeCount = (data || []).filter(p => p.status === 'safe').length;
      const expiringCount = (data || []).filter(p => p.status === 'expiring_soon').length;
      const expiredCount = (data || []).filter(p => p.status === 'expired').length;

      return (
        <div>
          {/* Toolbar: Stats + Search + Add */}
          <div className="emp-toolbar">
            <div className="emp-summary-pills">
              <span className="emp-pill"><FiPackage size={12} /> {(data || []).length} products</span>
              {totalValue > 0 && <span className="emp-pill" style={{ background: '#f3e8ff', color: '#7c3aed' }}><FiDollarSign size={12} /> Rs.{totalValue.toLocaleString('en-IN')}</span>}
              {safeCount > 0 && <span className="emp-pill" style={{ background: '#dcfce7', color: '#16a34a' }}>{safeCount} safe</span>}
              {expiringCount > 0 && <span className="emp-pill emp-pill-amber">{expiringCount} expiring</span>}
              {expiredCount > 0 && <span className="emp-pill" style={{ background: '#fee2e2', color: '#ef4444' }}>{expiredCount} expired</span>}
            </div>
            <div className="pd-toolbar-right">
              <div className="pd-search">
                <FiSearch size={14} />
                <input placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              </div>
              {!addingProduct && (
                <button className="emp-add-btn" onClick={() => { setAddingProduct(true); setEditingProduct(null); }}>
                  <FiPlus size={14} /> Add Product
                </button>
              )}
            </div>
          </div>

          {/* Add Product Form */}
          {addingProduct && (
            <div className="emp-form-card emp-form-add">
              <div className="emp-form-head">
                <div className="emp-form-title">
                  <div className="emp-form-icon" style={{ background: '#e6f4f1', color: '#00897b' }}><FiPlus size={16} /></div>
                  <div><h4>Add New Product</h4><p>to {detailModal.store.name}</p></div>
                </div>
                <button className="emp-form-close" onClick={() => setAddingProduct(false)}><FiX size={16} /></button>
              </div>
              <div className="emp-form-grid">
                <div className="emp-field"><label>Product Name <span>*</span></label><input type="text" value={addProductForm.name} onChange={e => setAddProductForm({ ...addProductForm, name: e.target.value })} placeholder="e.g., Amul Milk" /></div>
                <div className="emp-field"><label>Category <span>*</span></label><select value={addProductForm.category} onChange={e => setAddProductForm({ ...addProductForm, category: e.target.value })}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="emp-field"><label>Brand</label><input type="text" value={addProductForm.brand} onChange={e => setAddProductForm({ ...addProductForm, brand: e.target.value })} placeholder="e.g., Amul" /></div>
                <div className="emp-field"><label>Barcode</label><input type="text" value={addProductForm.barcode} onChange={e => setAddProductForm({ ...addProductForm, barcode: e.target.value })} placeholder="Scan or type" /></div>
                <div className="emp-field"><label>Quantity <span>*</span></label><input type="number" value={addProductForm.quantity} onChange={e => setAddProductForm({ ...addProductForm, quantity: e.target.value })} placeholder="e.g., 50" /></div>
                <div className="emp-field"><label>Price (Rs.) <span>*</span></label><input type="number" value={addProductForm.price} onChange={e => setAddProductForm({ ...addProductForm, price: e.target.value })} placeholder="e.g., 25" /></div>
                <div className="emp-field"><label>Expiry Date <span>*</span></label><input type="date" value={addProductForm.expiryDate} onChange={e => setAddProductForm({ ...addProductForm, expiryDate: e.target.value })} /></div>
                <div className="emp-field"><label>Batch No.</label><input type="text" value={addProductForm.batchNumber} onChange={e => setAddProductForm({ ...addProductForm, batchNumber: e.target.value })} placeholder="Optional" /></div>
              </div>
              <div className="emp-form-actions">
                <button className="emp-btn-cancel" onClick={() => setAddingProduct(false)}>Cancel</button>
                <button className="emp-btn-save" onClick={handleAddProduct}><FiPlus size={14} /> Add Product</button>
              </div>
            </div>
          )}

          {/* Empty */}
          {(!data || data.length === 0) && !addingProduct && (
            <div className="emp-empty">
              <div className="emp-empty-icon" style={{ background: '#e6f4f1', color: '#00897b' }}><FiPackage size={32} /></div>
              <h3>No Products Yet</h3>
              <p>Click "Add Product" to add the first product to this store.</p>
            </div>
          )}

          {/* Edit Product Form */}
          {editingProduct && (
            <div className="emp-form-card emp-form-edit">
              <div className="emp-form-head">
                <div className="emp-form-title">
                  <div className="emp-form-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><FiEdit2 size={14} /></div>
                  <div><h4>Editing {editingProduct.name}</h4><p>Update product details</p></div>
                </div>
                <button className="emp-form-close" onClick={() => setEditingProduct(null)}><FiX size={16} /></button>
              </div>
              <div className="emp-form-grid">
                <div className="emp-field"><label>Name</label><input type="text" value={editProductForm.name} onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })} /></div>
                <div className="emp-field"><label>Category</label><select value={editProductForm.category} onChange={e => setEditProductForm({ ...editProductForm, category: e.target.value })}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="emp-field"><label>Quantity</label><input type="number" value={editProductForm.quantity} onChange={e => setEditProductForm({ ...editProductForm, quantity: e.target.value })} /></div>
                <div className="emp-field"><label>Price (Rs.)</label><input type="number" value={editProductForm.price} onChange={e => setEditProductForm({ ...editProductForm, price: e.target.value })} /></div>
                <div className="emp-field"><label>Expiry Date</label><input type="date" value={editProductForm.expiryDate} onChange={e => setEditProductForm({ ...editProductForm, expiryDate: e.target.value })} /></div>
              </div>
              <div className="emp-form-actions">
                <button className="emp-btn-cancel" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button className="emp-btn-save" onClick={handleSaveProduct}><FiCheck size={14} /> Save Changes</button>
              </div>
            </div>
          )}

          {/* Product Cards */}
          {data && data.length > 0 && (
            <div className="pd-list">
              {searchedProducts.map(p => {
                const isEditing = editingProduct?._id === p._id;
                return (
                  <div key={p._id} className={`pd-card ${isEditing ? 'pd-card-editing' : ''} ${p.status === 'expired' ? 'pd-card-expired' : p.status === 'expiring_soon' ? 'pd-card-expiring' : ''}`}>
                    <div className="pd-card-main">
                      <div className="pd-card-left">
                        <div className="pd-product-avatar" style={{
                          background: p.status === 'expired' ? '#fef2f2' : p.status === 'expiring_soon' ? '#fffbeb' : '#dcfce7',
                          color: p.status === 'expired' ? '#ef4444' : p.status === 'expiring_soon' ? '#d97706' : '#16a34a'
                        }}>
                          <FiPackage size={16} />
                        </div>
                        <div className="pd-product-info">
                          <div className="pd-product-name">{p.name}</div>
                          {p.brand && <div className="pd-product-brand">{p.brand}</div>}
                        </div>
                      </div>
                      <div className="pd-card-meta">
                        <span className="pd-meta-tag">{p.category}</span>
                        <div className="pd-meta-detail"><span className="pd-meta-label">Qty</span><span className="pd-meta-value">{p.quantity}</span></div>
                        <div className="pd-meta-detail"><span className="pd-meta-label">Price</span><span className="pd-meta-value">Rs.{p.price}</span></div>
                        <div className="pd-meta-detail"><span className="pd-meta-label">Expiry</span><span className="pd-meta-value">{new Date(p.expiryDate).toLocaleDateString('en-IN')}</span></div>
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="pd-card-actions">
                        <button className="emp-edit-btn" onClick={() => startEditProduct(p)}><FiEdit2 size={13} /></button>
                        <button className="pd-delete-btn" onClick={() => handleDeleteProduct(p)}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {data && data.length > 0 && searchedProducts.length !== (data || []).length && (
            <div className="pd-footer">Showing {searchedProducts.length} of {(data || []).length} products</div>
          )}
        </div>
      );
    }

    // ===== EXPIRING =====
    if (type === 'expiring') {
      if (!data || data.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FiAlertTriangle size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
            <h3 style={{ color: 'var(--gray-500)', fontSize: 16 }}>No Expiring Products</h3>
            <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>All products in this store are safe!</p>
          </div>
        );
      }
      const expired = data.filter(p => p.status === 'expired');
      const expiringSoon = data.filter(p => p.status === 'expiring_soon');
      const lossValue = expired.reduce((sum, p) => sum + (p.price * p.quantity), 0);

      return (
        <div>
          <div style={{ display: 'flex', gap: 16, padding: '0 4px 12px', flexWrap: 'wrap' }}>
            {expired.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>
                <strong>{expired.length}</strong> expired
              </span>
            )}
            {expiringSoon.length > 0 && (
              <span style={{ fontSize: 13, color: '#b45309' }}>
                <strong>{expiringSoon.length}</strong> expiring soon
              </span>
            )}
            {lossValue > 0 && (
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>
                Loss: <strong>Rs.{lossValue.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>

          {/* Edit Product Form */}
          {editingProduct && (
            <div style={{
              padding: 16, marginBottom: 12, borderRadius: 10,
              background: '#f8fafc', border: '1px solid var(--gray-200)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14 }}>Editing — {editingProduct.name}</h4>
                <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                  <FiX size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Name</label>
                  <input type="text" value={editProductForm.name} onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })} style={{ padding: '7px 10px', fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Category</label>
                  <select value={editProductForm.category} onChange={e => setEditProductForm({ ...editProductForm, category: e.target.value })} style={{ padding: '7px 10px', fontSize: 13 }}>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Quantity</label>
                  <input type="number" value={editProductForm.quantity} onChange={e => setEditProductForm({ ...editProductForm, quantity: e.target.value })} style={{ padding: '7px 10px', fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Price (Rs.)</label>
                  <input type="number" value={editProductForm.price} onChange={e => setEditProductForm({ ...editProductForm, price: e.target.value })} style={{ padding: '7px 10px', fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Expiry Date</label>
                  <input type="date" value={editProductForm.expiryDate} onChange={e => setEditProductForm({ ...editProductForm, expiryDate: e.target.value })} style={{ padding: '7px 10px', fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditingProduct(null)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveProduct}>Save</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p._id} style={{ background: editingProduct?._id === p._id ? 'var(--primary-light)' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontSize: 13 }}>{p.category}</td>
                    <td>{p.quantity}</td>
                    <td>Rs.{p.price}</td>
                    <td style={{ fontSize: 13 }}>{new Date(p.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td style={{
                      fontWeight: 600,
                      color: p.daysUntilExpiry < 0 ? 'var(--danger)' : '#b45309'
                    }}>
                      {p.daysUntilExpiry < 0 ? `${Math.abs(p.daysUntilExpiry)}d ago` : `${p.daysUntilExpiry}d`}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => startEditProduct(p)}><FiEdit2 size={12} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p)}><FiTrash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  const getDetailTitle = () => {
    if (!detailModal) return '';
    const { type, store } = detailModal;
    const icons = { manager: FiUser, employees: FiUsers, products: FiPackage, expiring: FiAlertTriangle };
    const labels = { manager: 'Manager', employees: 'Employees', products: 'Products', expiring: 'Expiring Products' };
    const Icon = icons[type];
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={18} />} {labels[type]} — {store.name}
      </span>
    );
  };

  if (loading) return <div className="empty-state"><h3>Loading stores...</h3></div>;

  // Summary calculations
  const totalStores = stores.length;
  const totalProducts = stores.reduce((s, st) => s + (st.totalProducts || 0), 0);
  const totalExpiring = stores.reduce((s, st) => s + (st.expiringSoon || 0), 0);
  const totalExpired = stores.reduce((s, st) => s + (st.expiredProducts || 0), 0);
  const totalStockValue = stores.reduce((s, st) => s + (st.totalValue || 0), 0);
  const totalEmployees = stores.reduce((s, st) => s + (st.employeeCount || 0), 0);

  const filteredStores = stores.filter(s =>
    !storeSearch ||
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.address?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.managerName?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const summaryCards = [
    { icon: <FiMapPin size={20} />, iconBg: '#e6f4f1', iconColor: '#00897b', label: 'Total Stores', value: totalStores, sub: 'Active branches' },
    { icon: <FiPackage size={20} />, iconBg: '#dcfce7', iconColor: '#16a34a', label: 'Total Products', value: totalProducts, sub: 'Across all stores' },
    { icon: <FiAlertTriangle size={20} />, iconBg: '#fef3c7', iconColor: '#d97706', label: 'Expiring Soon', value: totalExpiring, sub: 'Needs attention' },
    { icon: <FiDollarSign size={20} />, iconBg: '#f3e8ff', iconColor: '#7c3aed', label: 'Stock Value', value: 'Rs.' + totalStockValue.toLocaleString('en-IN'), sub: 'Total inventory' },
  ];

  return (
    <div className="sm-root">

      {/* ── Page Header ── */}
      <div className="sm-header">
        <div>
          <h1 className="sm-title">Store Management</h1>
          <p className="sm-subtitle">{totalStores} store branches · {totalEmployees} employees · {totalProducts} products</p>
        </div>
        <button className="sm-add-btn" onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> Add Store
        </button>
      </div>

      {/* ── 4 Summary Stat Cards ── */}
      <div className="sm-stats-row">
        {summaryCards.map((card, i) => (
          <div className="sm-stat-card" key={i}>
            <div className="sm-stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
              {card.icon}
            </div>
            <div className="sm-stat-info">
              <div className="sm-stat-label">{card.label}</div>
              <div className="sm-stat-value">{card.value}</div>
              <div className="sm-stat-sub">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="sm-table-card">

        {/* Table Header with Search & Filter */}
        <div className="sm-table-header">
          <div className="sm-table-title-area">
            <h3 className="sm-table-title">All Stores</h3>
            <span className="sm-table-count">{filteredStores.length} of {totalStores}</span>
          </div>
          <div className="sm-table-actions">
            <div className="sm-search-box">
              <FiSearch size={14} />
              <input
                placeholder="Search stores..."
                value={storeSearch}
                onChange={e => setStoreSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredStores.length === 0 ? (
          <div className="sm-empty">
            <FiMapPin size={36} style={{ color: '#d1d5db' }} />
            <h3>{storeSearch ? 'No stores match your search' : 'No stores yet'}</h3>
            <p>{storeSearch ? 'Try a different search term' : 'Create your first store to start managing inventory.'}</p>
          </div>
        ) : (
          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Manager</th>
                  <th>Employees</th>
                  <th>Products</th>
                  <th>Expiring</th>
                  <th>Stock Value</th>
                  <th>Health</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store, idx) => {
                  const safeN = (store.totalProducts || 0) - (store.expiringSoon || 0) - (store.expiredProducts || 0);
                  const healthPct = store.totalProducts ? Math.round((safeN / store.totalProducts) * 100) : 100;
                  const hasIssues = (store.expiringSoon || 0) + (store.expiredProducts || 0) > 0;

                  return (
                    <tr key={store._id}>
                      {/* Store Name + Address + Phone */}
                      <td>
                        <div className="sm-store-cell">
                          <div className="sm-store-avatar" style={{ background: `hsl(${idx * 47 + 160}, 60%, 92%)`, color: `hsl(${idx * 47 + 160}, 50%, 35%)` }}>
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sm-store-name">{store.name}</div>
                            <div className="sm-store-addr">
                              <FiMapPin size={11} /> {store.address}
                            </div>
                            {store.phone && (
                              <div className="sm-store-phone">
                                <FiPhone size={10} /> {store.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Manager */}
                      <td>
                        <div
                          className="sm-manager-cell"
                          onClick={() => openDetail('manager', store)}
                        >
                          {store.managerName && store.managerName !== 'Not assigned' ? (
                            <>
                              <div className="sm-mgr-avatar">
                                {store.managerName.charAt(0).toUpperCase()}
                              </div>
                              <span>{store.managerName}</span>
                            </>
                          ) : (
                            <span className="sm-not-assigned">Not assigned</span>
                          )}
                        </div>
                      </td>

                      {/* Employees */}
                      <td>
                        <span
                          className="sm-clickable-num"
                          onClick={() => openDetail('employees', store)}
                        >
                          <FiUsers size={13} /> {store.employeeCount || 0}
                        </span>
                      </td>

                      {/* Products */}
                      <td>
                        <span
                          className="sm-clickable-num sm-clickable-green"
                          onClick={() => openDetail('products', store)}
                        >
                          <FiPackage size={13} /> {store.totalProducts || 0}
                        </span>
                      </td>

                      {/* Expiring */}
                      <td>
                        {hasIssues ? (
                          <span
                            className="sm-clickable-num sm-clickable-warn"
                            onClick={() => openDetail('expiring', store)}
                          >
                            <FiAlertTriangle size={13} />
                            {(store.expiringSoon || 0) + (store.expiredProducts || 0)}
                          </span>
                        ) : (
                          <span className="sm-safe-tag">All Safe</span>
                        )}
                      </td>

                      {/* Stock Value */}
                      <td>
                        <span className="sm-value-cell">Rs.{(store.totalValue || 0).toLocaleString('en-IN')}</span>
                      </td>

                      {/* Health Bar */}
                      <td>
                        <div className="sm-health">
                          <div className="sm-health-bar">
                            <div
                              className="sm-health-fill"
                              style={{
                                width: healthPct + '%',
                                background: healthPct >= 80 ? '#00897b' : healthPct >= 50 ? '#d97706' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className="sm-health-pct" style={{
                            color: healthPct >= 80 ? '#00897b' : healthPct >= 50 ? '#d97706' : '#ef4444'
                          }}>{healthPct}%</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="sm-actions-cell">
                          <button className="sm-action-btn sm-action-edit" onClick={() => openEdit(store)} title="Edit Store">
                            <FiEdit2 size={14} />
                          </button>
                          <button className="sm-action-btn sm-action-delete" onClick={() => handleDelete(store._id, store.name)} title="Deactivate">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {filteredStores.length > 0 && (
          <div className="sm-table-footer">
            <span>Showing {filteredStores.length} of {totalStores} stores</span>
          </div>
        )}
      </div>

      {/* Add/Edit Store Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="as-modal-header">
              <div className="as-modal-title-row">
                <div className="as-modal-icon">
                  {editStore ? <FiEdit2 size={18} /> : <FiPlus size={18} />}
                </div>
                <div>
                  <h2 className="as-modal-title">{editStore ? 'Edit Store' : 'Add New Store'}</h2>
                  <p className="as-modal-sub">{editStore ? 'Update store information' : 'Create a new branch to manage inventory'}</p>
                </div>
              </div>
              <button className="emp-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="as-modal-body">
                <div className="as-field">
                  <label className="as-label">
                    <FiMapPin size={14} /> Store Name <span className="as-req">*</span>
                  </label>
                  <input
                    className="as-input"
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Anna Nagar Branch"
                    required
                  />
                </div>
                <div className="as-field">
                  <label className="as-label">
                    <FiMapPin size={14} /> Address <span className="as-req">*</span>
                  </label>
                  <input
                    className="as-input"
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Full address of the store"
                    required
                  />
                </div>
                <div className="as-field">
                  <label className="as-label">
                    <FiPhone size={14} /> Phone Number
                  </label>
                  <input
                    className="as-input"
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g., +91 98765 43210"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="as-modal-footer">
                <button type="button" className="emp-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="emp-btn-save">
                  {editStore ? <><FiCheck size={14} /> Save Changes</> : <><FiPlus size={14} /> Create Store</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drill-Down Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="emp-modal" onClick={e => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-title-row">
                <div className="emp-modal-icon">
                  {detailModal.type === 'manager' && <FiUser size={18} />}
                  {detailModal.type === 'employees' && <FiUsers size={18} />}
                  {detailModal.type === 'products' && <FiPackage size={18} />}
                  {detailModal.type === 'expiring' && <FiAlertTriangle size={18} />}
                </div>
                <div>
                  <h2 className="emp-modal-title">
                    {detailModal.type === 'manager' && 'Manager'}
                    {detailModal.type === 'employees' && 'Employees'}
                    {detailModal.type === 'products' && 'Products'}
                    {detailModal.type === 'expiring' && 'Expiring Products'}
                  </h2>
                  <p className="emp-modal-sub">{detailModal.store.name}</p>
                </div>
              </div>
              <button className="emp-modal-close" onClick={() => setDetailModal(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="emp-modal-body">
              {renderDetailContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
