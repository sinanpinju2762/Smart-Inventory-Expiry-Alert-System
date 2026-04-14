import { useState, useEffect } from 'react';
import { FiBell, FiMail, FiSave, FiSettings, FiClock, FiShield, FiSmartphone, FiUser, FiLock, FiChevronDown, FiCheck, FiSend, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('alerts');

  const [settings, setSettings] = useState({
    alertDays: 7,
    enableBrowserNotifications: true,
    enableEmailAlerts: false,
    emailAddress: '',
    alertTime: '08:00'
  });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [password, setPassword] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('inventorySettings');
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('inventorySettings', JSON.stringify(settings));
    toast.success('Settings saved!');

    if (settings.enableBrowserNotifications && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Browser notifications enabled');
        }
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await API.put('/auth/profile', { name: profile.name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password.current || !password.newPass) {
      return toast.error('Please fill in all password fields');
    }
    if (password.newPass !== password.confirm) {
      return toast.error('New passwords do not match');
    }
    if (password.newPass.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword: password.current,
        newPassword: password.newPass
      });
      toast.success('Password changed!');
      setPassword({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Smart Inventory Alert', {
        body: 'This is a test notification! Your alerts are working.',
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Smart Inventory Alert', {
            body: 'This is a test notification! Your alerts are working.'
          });
        } else {
          toast.error('Please allow notifications in your browser');
        }
      });
    } else {
      toast.error('Your browser does not support notifications');
    }
  };

  const sections = [
    { key: 'alerts', label: 'Alert Preferences', icon: FiBell, desc: 'Configure expiry alerts & timing' },
    { key: 'notifications', label: 'Notifications', icon: FiSmartphone, desc: 'Browser & email notifications' },
    { key: 'profile', label: 'Profile', icon: FiUser, desc: 'Your account information' },
    { key: 'security', label: 'Security', icon: FiLock, desc: 'Password & security settings' },
  ];

  return (
    <div className="st-root">

      {/* ── Header ── */}
      <div className="st-header">
        <div className="st-header-left">
          <div className="st-header-icon">
            <FiSettings size={22} />
          </div>
          <div>
            <h1 className="st-title">Settings</h1>
            <p className="st-subtitle">Manage your preferences, notifications & account</p>
          </div>
        </div>
      </div>

      {/* ── Layout: Side Nav + Content ── */}
      <div className="st-layout">

        {/* Side Navigation */}
        <div className="st-sidenav">
          {sections.map(sec => (
            <button
              key={sec.key}
              className={`st-nav-item ${activeSection === sec.key ? 'st-nav-active' : ''}`}
              onClick={() => setActiveSection(sec.key)}
            >
              <div className="st-nav-icon"><sec.icon size={18} /></div>
              <div className="st-nav-text">
                <div className="st-nav-label">{sec.label}</div>
                <div className="st-nav-desc">{sec.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="st-content">

          {/* ═══ ALERT PREFERENCES ═══ */}
          {activeSection === 'alerts' && (
            <div className="st-section">
              <div className="st-section-head">
                <div className="st-section-icon st-icon-teal"><FiBell size={20} /></div>
                <div>
                  <h2 className="st-section-title">Alert Preferences</h2>
                  <p className="st-section-desc">Configure when and how you receive expiry alerts</p>
                </div>
              </div>

              {/* Alert Window */}
              <div className="st-field-group">
                <div className="st-field-header">
                  <label className="st-field-label">Alert Window</label>
                  <span className="st-field-hint">How many days before expiry should we alert you?</span>
                </div>
                <div className="st-chips">
                  {[3, 5, 7, 10, 15, 30].map(d => (
                    <button
                      key={d}
                      className={`st-chip ${settings.alertDays === d ? 'st-chip-active' : ''}`}
                      onClick={() => setSettings({ ...settings, alertDays: d })}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Time */}
              <div className="st-field-group">
                <div className="st-field-header">
                  <label className="st-field-label">Daily Alert Time</label>
                  <span className="st-field-hint">When should we check for expiring products?</span>
                </div>
                <div className="st-time-input">
                  <FiClock size={16} />
                  <input
                    type="time"
                    value={settings.alertTime}
                    onChange={e => setSettings({ ...settings, alertTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="st-save-row">
                <button className="st-save-btn" onClick={handleSaveSettings}>
                  <FiSave size={15} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ═══ NOTIFICATIONS ═══ */}
          {activeSection === 'notifications' && (
            <div className="st-section">
              <div className="st-section-head">
                <div className="st-section-icon st-icon-blue"><FiSmartphone size={20} /></div>
                <div>
                  <h2 className="st-section-title">Notifications</h2>
                  <p className="st-section-desc">Choose how you want to be notified about expiring products</p>
                </div>
              </div>

              {/* Browser Notifications */}
              <div className="st-toggle-card">
                <div className="st-toggle-info">
                  <div className="st-toggle-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
                    <FiBell size={18} />
                  </div>
                  <div>
                    <div className="st-toggle-label">Browser Push Notifications</div>
                    <div className="st-toggle-desc">Get instant desktop notifications when products are about to expire</div>
                  </div>
                </div>
                <div className="st-toggle-actions">
                  <label className="st-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableBrowserNotifications}
                      onChange={e => setSettings({ ...settings, enableBrowserNotifications: e.target.checked })}
                    />
                    <span className="st-switch-slider" />
                  </label>
                </div>
              </div>

              {settings.enableBrowserNotifications && (
                <div className="st-test-row">
                  <button className="st-test-btn" onClick={testNotification}>
                    <FiSend size={14} /> Send Test Notification
                  </button>
                  <span className="st-test-hint">
                    <FiInfo size={12} /> Make sure to allow notifications in your browser
                  </span>
                </div>
              )}

              {/* Email Notifications */}
              <div className="st-toggle-card" style={{ marginTop: 16 }}>
                <div className="st-toggle-info">
                  <div className="st-toggle-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                    <FiMail size={18} />
                  </div>
                  <div>
                    <div className="st-toggle-label">Daily Email Alerts</div>
                    <div className="st-toggle-desc">Receive a daily summary of expiring products to your email</div>
                  </div>
                </div>
                <div className="st-toggle-actions">
                  <label className="st-switch">
                    <input
                      type="checkbox"
                      checked={settings.enableEmailAlerts}
                      onChange={e => setSettings({ ...settings, enableEmailAlerts: e.target.checked })}
                    />
                    <span className="st-switch-slider" />
                  </label>
                </div>
              </div>

              {settings.enableEmailAlerts && (
                <div className="st-email-field">
                  <label className="st-field-label">Email Address</label>
                  <div className="st-input-with-icon">
                    <FiMail size={15} />
                    <input
                      type="email"
                      value={settings.emailAddress}
                      onChange={e => setSettings({ ...settings, emailAddress: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              )}

              <div className="st-save-row">
                <button className="st-save-btn" onClick={handleSaveSettings}>
                  <FiSave size={15} /> Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* ═══ PROFILE ═══ */}
          {activeSection === 'profile' && (
            <div className="st-section">
              <div className="st-section-head">
                <div className="st-section-icon st-icon-green"><FiUser size={20} /></div>
                <div>
                  <h2 className="st-section-title">Profile Information</h2>
                  <p className="st-section-desc">Manage your account details</p>
                </div>
              </div>

              {/* Avatar + Info */}
              <div className="st-profile-card">
                <div className="st-profile-avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="st-profile-info">
                  <div className="st-profile-name">{user?.name}</div>
                  <div className="st-profile-role">
                    <span className="st-role-badge">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
                    {user?.store?.name && <span className="st-store-badge">{user.store.name}</span>}
                  </div>
                  <div className="st-profile-email">{user?.email}</div>
                </div>
              </div>

              {/* Edit Name */}
              <div className="st-field-group">
                <label className="st-field-label">Full Name</label>
                <div className="st-input-with-icon">
                  <FiUser size={15} />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="st-field-group">
                <label className="st-field-label">Email Address</label>
                <div className="st-input-with-icon st-input-disabled">
                  <FiMail size={15} />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    placeholder="Email address"
                  />
                </div>
                <span className="st-field-hint" style={{ marginTop: 6 }}>Email cannot be changed</span>
              </div>

              <div className="st-save-row">
                <button className="st-save-btn" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : <><FiSave size={15} /> Update Profile</>}
                </button>
              </div>
            </div>
          )}

          {/* ═══ SECURITY ═══ */}
          {activeSection === 'security' && (
            <div className="st-section">
              <div className="st-section-head">
                <div className="st-section-icon st-icon-red"><FiShield size={20} /></div>
                <div>
                  <h2 className="st-section-title">Security</h2>
                  <p className="st-section-desc">Update your password to keep your account secure</p>
                </div>
              </div>

              {/* Change Password */}
              <div className="st-field-group">
                <label className="st-field-label">Current Password</label>
                <div className="st-input-with-icon">
                  <FiLock size={15} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={password.current}
                    onChange={e => setPassword({ ...password, current: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <button className="st-eye-btn" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                    {showCurrentPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="st-pass-row">
                <div className="st-field-group" style={{ flex: 1 }}>
                  <label className="st-field-label">New Password</label>
                  <div className="st-input-with-icon">
                    <FiLock size={15} />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={password.newPass}
                      onChange={e => setPassword({ ...password, newPass: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button className="st-eye-btn" onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="st-field-group" style={{ flex: 1 }}>
                  <label className="st-field-label">Confirm New Password</label>
                  <div className="st-input-with-icon">
                    <FiLock size={15} />
                    <input
                      type="password"
                      value={password.confirm}
                      onChange={e => setPassword({ ...password, confirm: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    {password.confirm && password.newPass === password.confirm && (
                      <FiCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Password Strength Hints */}
              {password.newPass && (
                <div className="st-pass-hints">
                  <div className={`st-pass-hint ${password.newPass.length >= 6 ? 'st-hint-pass' : ''}`}>
                    <FiCheck size={12} /> At least 6 characters
                  </div>
                  <div className={`st-pass-hint ${/[A-Z]/.test(password.newPass) ? 'st-hint-pass' : ''}`}>
                    <FiCheck size={12} /> One uppercase letter
                  </div>
                  <div className={`st-pass-hint ${/[0-9]/.test(password.newPass) ? 'st-hint-pass' : ''}`}>
                    <FiCheck size={12} /> One number
                  </div>
                  <div className={`st-pass-hint ${password.newPass === password.confirm && password.confirm ? 'st-hint-pass' : ''}`}>
                    <FiCheck size={12} /> Passwords match
                  </div>
                </div>
              )}

              <div className="st-save-row">
                <button className="st-save-btn st-save-red" onClick={handleChangePassword} disabled={saving}>
                  {saving ? 'Changing...' : <><FiShield size={15} /> Change Password</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
