import { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiMail, FiCalendar, FiPlus, FiUserMinus, FiClipboard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const allCategories = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'];

export default function MyTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const { data } = await API.get('/auth/team');
      setTeam(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/team/add', addForm);
      toast.success(`${addForm.name} added to your store!`);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '' });
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    }
  };

  // Remove staff from store
  const handleRemove = async (staff) => {
    if (!window.confirm(`Remove "${staff.name}" from your store?\n\nThey won't be deleted — Admin can reassign them to another store.`)) return;
    try {
      await API.put(`/auth/team/${staff._id}/remove`);
      toast.success(`${staff.name} removed from store`);
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  // Open assign work modal
  const openAssign = (staff) => {
    setShowAssignModal(staff);
    setSelectedCategories(staff.assignedCategories || []);
  };

  // Save assigned categories
  const handleAssignSave = async () => {
    try {
      await API.put(`/auth/team/${showAssignModal._id}/assign`, { categories: selectedCategories });
      toast.success(`Work assigned to ${showAssignModal.name}`);
      setShowAssignModal(null);
      fetchTeam();
    } catch (err) {
      toast.error('Failed to assign work');
    }
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  if (loading) return <div className="empty-state"><h3>Loading team...</h3></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>My Team</h1>
          <p>{team.length} staff members in {user?.store?.name || 'your store'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add Staff
        </button>
      </div>

      {team.length === 0 ? (
        <div className="empty-state">
          <FiUsers style={{ fontSize: 48, marginBottom: 12 }} />
          <h3>No staff members yet</h3>
          <p>Click "Add Staff" to add your first team member.</p>
        </div>
      ) : (
        <div className="store-grid">
          {team.map(member => (
            <div className="store-card" key={member._id}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 2 }}>{member.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: 'var(--primary-light)', color: 'var(--primary)'
                    }}>
                      <FiShield size={10} /> Staff
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: 'var(--success-light)', color: 'var(--success)'
                    }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--gray-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FiMail size={14} /> {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCalendar size={14} /> Joined {new Date(member.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>

              {/* Assigned Work */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
                  Assigned Work:
                </div>
                {member.assignedCategories && member.assignedCategories.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {member.assignedCategories.map(cat => (
                      <span key={cat} style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        background: 'var(--gray-100)', color: 'var(--gray-700)',
                        border: '1px solid var(--gray-200)'
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>No work assigned yet</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openAssign(member)}>
                  <FiClipboard size={13} /> Assign Work
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleRemove(member)}>
                  <FiUserMinus size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2>Add New Staff</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>
              New staff will be added to <strong>{user?.store?.name || 'your store'}</strong>
            </p>
            <form onSubmit={handleAddStaff}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g., Ravi Kumar"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="e.g., ravi@gmail.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Work Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2>Assign Work</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>
              Select categories for <strong>{showAssignModal.name}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allCategories.map(cat => (
                <label
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: selectedCategories.includes(cat)
                      ? '2px solid var(--primary)'
                      : '2px solid var(--gray-200)',
                    background: selectedCategories.includes(cat)
                      ? 'var(--primary-light)' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => {}}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{
                    fontSize: 14, fontWeight: selectedCategories.includes(cat) ? 600 : 400,
                    color: selectedCategories.includes(cat) ? 'var(--primary)' : 'var(--gray-700)'
                  }}>
                    {cat}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)' }}>
              {selectedCategories.length} categories selected
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
