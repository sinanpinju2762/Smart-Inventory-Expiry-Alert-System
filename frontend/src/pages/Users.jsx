import { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const allCategories = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editStore, setEditStore] = useState('');
  const [editCategories, setEditCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, storesRes] = await Promise.all([
        API.get('/auth/users'),
        API.get('/stores')
      ]);
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditStore(user.store?._id || '');
    setEditCategories(user.assignedCategories || []);
  };

  const handleSave = async () => {
    try {
      await API.put(`/auth/users/${editUser._id}/role`, {
        role: editRole,
        store: editStore || null
      });
      // Save assigned categories
      if (editStore) {
        try {
          await API.put(`/auth/team/${editUser._id}/assign`, { categories: editCategories });
        } catch {}
      }
      toast.success(`${editUser.name} updated successfully`);
      setEditUser(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const toggleCategory = (cat) => {
    setEditCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

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
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: s.bg, color: s.color
      }}>
        <FiShield size={12} />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) return <div className="empty-state"><h3>Loading users...</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>{users.length} registered users — Assign roles, stores & work</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3><FiUsers style={{ marginRight: 8 }} />All Users</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Store</th>
              <th>Assigned Work</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td style={{ fontWeight: 600 }}>{user.name}</td>
                <td>{user.email}</td>
                <td>{getRoleBadge(user.role)}</td>
                <td>
                  {user.store?.name || (
                    <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Not assigned</span>
                  )}
                </td>
                <td>
                  {user.assignedCategories && user.assignedCategories.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {user.assignedCategories.map(cat => (
                        <span key={cat} style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                          background: 'var(--gray-100)', color: 'var(--gray-600)',
                          border: '1px solid var(--gray-200)'
                        }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>—</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  {user._id === currentUser._id ? (
                    <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>You</span>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(user)}>
                      <FiEdit2 size={13} /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2>Edit User</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>
              Update <strong>{editUser.name}</strong> — role, store & assigned work
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Role */}
              <div className="form-group">
                <label>Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {/* Store */}
              <div className="form-group">
                <label>Assigned Store</label>
                <select value={editStore} onChange={e => setEditStore(e.target.value)}>
                  <option value="">— No Store —</option>
                  {stores.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Work — only show for staff */}
              {editRole === 'staff' && editStore && (
                <div className="form-group">
                  <label>Assigned Work ({editCategories.length} selected)</label>
                  <div style={{
                    maxHeight: 200, overflowY: 'auto', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: 8
                  }}>
                    {allCategories.map(cat => (
                      <label
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                          background: editCategories.includes(cat) ? 'var(--primary-light)' : 'white',
                          marginBottom: 4
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editCategories.includes(cat)}
                          onChange={() => {}}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{
                          fontSize: 13,
                          fontWeight: editCategories.includes(cat) ? 600 : 400,
                          color: editCategories.includes(cat) ? 'var(--primary)' : 'var(--gray-700)'
                        }}>
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
