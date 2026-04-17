import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler, Title, Tooltip, Legend
} from 'chart.js';
import {
  FiPackage, FiCheckCircle, FiAlertTriangle, FiXCircle,
  FiSearch, FiBell, FiMoreHorizontal, FiArrowUp, FiArrowDown,
  FiDollarSign, FiTrendingUp, FiSliders, FiMapPin,
  FiSettings, FiFileText, FiLogOut, FiUser, FiShield, FiX, FiClock
} from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/Logo';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Title, Tooltip, Legend);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [storeSummary, setStoreSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Topbar interactive state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const moreRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Search products live ──
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(data.slice(0, 8));
        setSearchOpen(true);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        API.get('/products/dashboard'),
        API.get('/products/alerts?days=7')
      ]);
      setStats(statsRes.data);
      setRecentAlerts(alertsRes.data.slice(0, 6));
      if (user?.role === 'admin') {
        try {
          const storeRes = await API.get('/stores/summary');
          setStoreSummary(storeRes.data);
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="v2-root">
      {/* Topbar skeleton */}
      <div className="sk-topbar">
        <div>
          <div className="sk-box" style={{ width: 220, height: 28, marginBottom: 8 }} />
          <div className="sk-box" style={{ width: 160, height: 16 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="sk-box" style={{ width: 180, height: 38, borderRadius: 20 }} />
          <div className="sk-box" style={{ width: 38, height: 38, borderRadius: '50%' }} />
          <div className="sk-box" style={{ width: 38, height: 38, borderRadius: '50%' }} />
          <div className="sk-box" style={{ width: 160, height: 44, borderRadius: 24 }} />
        </div>
      </div>
      {/* 4 metric cards skeleton */}
      <div className="v2-cards-row">
        {[...Array(4)].map((_, i) => (
          <div className="v2-metric-card" key={i}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div className="sk-box" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk-box" style={{ width: '70%', height: 14, marginBottom: 6 }} />
                <div className="sk-box" style={{ width: '50%', height: 12 }} />
              </div>
            </div>
            <div className="sk-box" style={{ width: 60, height: 32 }} />
          </div>
        ))}
      </div>
      {/* Middle row skeleton */}
      <div className="v2-middle-row">
        <div className="v2-chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="sk-box" style={{ width: 140, height: 16, marginBottom: 8 }} />
              <div className="sk-box" style={{ width: 100, height: 12 }} />
            </div>
            <div className="sk-box" style={{ width: 90, height: 28, borderRadius: 20 }} />
          </div>
          <div className="sk-box" style={{ width: '100%', height: 160, borderRadius: 12 }} />
        </div>
        <div className="v2-right-stats">
          {[...Array(4)].map((_, i) => (
            <div className="v2-right-stat" key={i}>
              <div className="sk-box" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk-box" style={{ width: '60%', height: 12, marginBottom: 6 }} />
                <div className="sk-box" style={{ width: '40%', height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Table skeleton */}
      <div className="v2-bottom-row">
        <div className="v2-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="sk-box" style={{ width: 140, height: 16, marginBottom: 8 }} />
              <div className="sk-box" style={{ width: 200, height: 12 }} />
            </div>
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
              <div className="sk-box" style={{ width: 160, height: 14 }} />
              <div className="sk-box" style={{ width: 80, height: 14 }} />
              <div className="sk-box" style={{ width: 90, height: 14 }} />
              <div className="sk-box" style={{ width: 60, height: 14 }} />
              <div className="sk-box" style={{ width: 70, height: 22, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const totalProducts = stats?.totalProducts || 0;
  const safeProducts = stats?.safeProducts || 0;
  const expiringSoon = stats?.expiringSoon || 0;
  const expired = stats?.expired || 0;
  const totalValue = stats?.totalValue || 0;
  const safePercent = totalProducts ? Math.round((safeProducts / totalProducts) * 100) : 0;

  // Line chart data from categories
  const lineLabels = stats?.categoryStats?.map(c => c._id) || [];
  const lineData = stats?.categoryStats?.map(c => c.count) || [];

  const lineChartData = {
    labels: lineLabels.length ? lineLabels : ['No data'],
    datasets: [{
      label: 'Products',
      data: lineData.length ? lineData : [0],
      fill: true,
      backgroundColor: 'rgba(0,137,123,0.08)',
      borderColor: '#00897b',
      borderWidth: 2.5,
      pointBackgroundColor: '#00897b',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      pointRadius: 5,
      tension: 0.4
    }]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#00897b', padding: 10 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        beginAtZero: true
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'expired') return <span className="v2-badge v2-badge-red">Expired</span>;
    if (status === 'expiring_soon') return <span className="v2-badge v2-badge-yellow">Expiring</span>;
    return <span className="v2-badge v2-badge-green">Safe</span>;
  };

  const topCards = [
    {
      icon: <FiPackage size={22} />,
      iconBg: '#e6f4f1', iconColor: '#00897b',
      label: 'Total Products', sub: 'All stock items',
      value: totalProducts, trend: null,
      link: '/inventory'
    },
    {
      icon: <FiCheckCircle size={22} />,
      iconBg: '#dcfce7', iconColor: '#16a34a',
      label: 'Safe Products', sub: 'No expiry concern',
      value: safeProducts, trend: { up: true, val: safePercent + '%' },
      link: '/inventory?status=safe'
    },
    {
      icon: <FiAlertTriangle size={22} />,
      iconBg: '#fef3c7', iconColor: '#d97706',
      label: 'Expiring Soon', sub: 'Within 7 days',
      value: expiringSoon, trend: expiringSoon > 0 ? { up: false, val: expiringSoon } : null,
      link: '/alerts?tab=soon'
    },
    {
      icon: <FiXCircle size={22} />,
      iconBg: '#fee2e2', iconColor: '#ef4444',
      label: 'Expired', sub: 'Needs attention',
      value: expired, trend: expired > 0 ? { up: false, val: expired } : null,
      link: '/alerts?tab=expired'
    }
  ];

  const rightStats = [
    { icon: <FiDollarSign size={18} />, iconBg: '#fef3c7', iconColor: '#d97706', label: 'Stock Value', value: 'Rs.' + totalValue.toLocaleString('en-IN') },
    { icon: <FiCheckCircle size={18} />, iconBg: '#dcfce7', iconColor: '#16a34a', label: 'Safe Rate', value: safePercent + '%' },
    { icon: <FiAlertTriangle size={18} />, iconBg: '#fff7ed', iconColor: '#ea580c', label: 'Expiring', value: expiringSoon },
    { icon: <FiTrendingUp size={18} />, iconBg: '#e6f4f1', iconColor: '#00897b', label: 'Categories', value: stats?.categoryStats?.length || 0 }
  ];

  return (
    <div className="v2-root">

      {/* ── Top Header ── */}
      <div className="v2-topbar">
        <div className="v2-greeting">
          <h1>{getGreeting()}, <span>{user?.name?.split(' ')[0]}</span> 👋</h1>
          <p>
            {user?.role === 'admin' ? 'Here\'s your overall business overview.'
              : user?.role === 'manager' ? `Store overview — ${user?.store?.name || ''}`
              : 'Your inventory at a glance.'}
          </p>
        </div>

        <div className="v2-topbar-right">

          {/* ── 1. SEARCH ── */}
          <div className="v2-search" ref={searchRef}>
            <FiSearch size={15} style={{ color: '#9ca3af' }} />
            <input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            />
            {searchQuery && (
              <button className="tb-clear-btn" onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}>
                <FiX size={12} />
              </button>
            )}
            {searchOpen && searchResults.length > 0 && (
              <div className="tb-dropdown tb-search-drop">
                <div className="tb-drop-label">Products</div>
                {searchResults.map(p => (
                  <button key={p._id} className="tb-search-item" onClick={() => { navigate('/inventory'); setSearchOpen(false); setSearchQuery(''); }}>
                    <div className={`tb-search-dot ${p.status === 'expired' ? 'tb-dot-red' : p.status === 'expiring_soon' ? 'tb-dot-amber' : 'tb-dot-green'}`} />
                    <div className="tb-search-info">
                      <span className="tb-search-name">{p.name}</span>
                      <span className="tb-search-meta">{p.category} · Rs.{p.price} · Qty: {p.quantity}</span>
                    </div>
                    <span className={`tb-search-status ${p.status === 'expired' ? 'tb-st-red' : p.status === 'expiring_soon' ? 'tb-st-amber' : 'tb-st-green'}`}>
                      {p.status === 'expired' ? 'Expired' : p.status === 'expiring_soon' ? 'Expiring' : 'Safe'}
                    </span>
                  </button>
                ))}
                <button className="tb-drop-footer" onClick={() => { navigate('/inventory'); setSearchOpen(false); setSearchQuery(''); }}>
                  <FiSearch size={12} /> View all in Inventory
                </button>
              </div>
            )}
            {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
              <div className="tb-dropdown tb-search-drop">
                <div className="tb-drop-empty">No products found for "{searchQuery}"</div>
              </div>
            )}
          </div>

          {/* ── 2. BELL (Notifications) ── */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button className="v2-icon-btn" title="Notifications" onClick={() => { setBellOpen(!bellOpen); setMoreOpen(false); setUserOpen(false); }}>
              <FiBell size={18} />
              {expiringSoon + expired > 0 && <span className="v2-notif-dot" />}
              {(expiringSoon + expired) > 0 && <span className="tb-notif-count">{expiringSoon + expired}</span>}
            </button>
            {bellOpen && (
              <div className="tb-dropdown tb-bell-drop">
                <div className="tb-drop-header">
                  <span className="tb-drop-title">Notifications</span>
                  <span className="tb-drop-badge">{expiringSoon + expired} alerts</span>
                </div>
                {recentAlerts.length > 0 ? recentAlerts.slice(0, 5).map(p => {
                  const days = p.daysUntilExpiry;
                  return (
                    <div key={p._id} className="tb-notif-item">
                      <div className={`tb-notif-icon ${days < 0 ? 'tb-ni-red' : 'tb-ni-amber'}`}>
                        {days < 0 ? <FiXCircle size={14} /> : <FiAlertTriangle size={14} />}
                      </div>
                      <div className="tb-notif-body">
                        <span className="tb-notif-name">{p.name}</span>
                        <span className="tb-notif-detail">
                          {days < 0 ? `Expired ${Math.abs(days)} days ago` : days === 0 ? 'Expires today!' : `Expires in ${days} days`}
                          {user?.role === 'admin' && p.store?.name ? ` · ${p.store.name}` : ''}
                        </span>
                      </div>
                      <span className="tb-notif-time"><FiClock size={10} /> {new Date(p.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  );
                }) : (
                  <div className="tb-drop-empty"><FiCheckCircle size={18} style={{ color: '#16a34a' }} /> All products are safe!</div>
                )}
                <Link to="/alerts" className="tb-drop-footer" onClick={() => setBellOpen(false)}>
                  <FiAlertTriangle size={12} /> View All Alerts
                </Link>
              </div>
            )}
          </div>

          {/* ── 3. MORE MENU (...) ── */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button className="v2-icon-btn" title="Quick menu" onClick={() => { setMoreOpen(!moreOpen); setBellOpen(false); setUserOpen(false); }}>
              <FiMoreHorizontal size={18} />
            </button>
            {moreOpen && (
              <div className="tb-dropdown tb-more-drop">
                <div className="tb-drop-header">
                  <span className="tb-drop-title">Quick Actions</span>
                </div>
                <Link to="/inventory" className="tb-menu-item" onClick={() => setMoreOpen(false)}>
                  <FiPackage size={15} /><span>Inventory</span>
                </Link>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Link to="/reports" className="tb-menu-item" onClick={() => setMoreOpen(false)}>
                    <FiFileText size={15} /><span>Reports</span>
                  </Link>
                )}
                <Link to="/alerts" className="tb-menu-item" onClick={() => setMoreOpen(false)}>
                  <FiAlertTriangle size={15} />
                  <span>Alerts</span>
                  {(expiringSoon + expired) > 0 && <span className="tb-menu-badge">{expiringSoon + expired}</span>}
                </Link>
                <Link to="/settings" className="tb-menu-item" onClick={() => setMoreOpen(false)}>
                  <FiSettings size={15} /><span>Settings</span>
                </Link>
                <div className="tb-menu-divider" />
                <button className="tb-menu-item tb-menu-danger" onClick={() => { setMoreOpen(false); logout(); }}>
                  <FiLogOut size={15} /><span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* ── 4. USER PILL ── */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <div className="v2-user-pill" style={{ cursor: 'pointer' }} onClick={() => { setUserOpen(!userOpen); setBellOpen(false); setMoreOpen(false); }}>
              <div className="v2-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="v2-user-name">{user?.name}</div>
                <div className="v2-user-email">{user?.email}</div>
              </div>
            </div>
            {userOpen && (
              <div className="tb-dropdown tb-user-drop">
                <div className="tb-user-header">
                  <div className="tb-user-big-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="tb-user-hname">{user?.name}</div>
                    <div className="tb-user-hemail">{user?.email}</div>
                    <span className="tb-user-role-badge">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
                  </div>
                </div>
                {user?.store?.name && (
                  <div className="tb-user-store"><FiMapPin size={12} /> {user.store.name}</div>
                )}
                <div className="tb-menu-divider" />
                <Link to="/settings" className="tb-menu-item" onClick={() => setUserOpen(false)}>
                  <FiUser size={15} /><span>My Profile</span>
                </Link>
                <Link to="/settings" className="tb-menu-item" onClick={() => setUserOpen(false)}>
                  <FiShield size={15} /><span>Change Password</span>
                </Link>
                <div className="tb-menu-divider" />
                <button className="tb-menu-item tb-menu-danger" onClick={() => { setUserOpen(false); logout(); }}>
                  <FiLogOut size={15} /><span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 4 Top Metric Cards ── */}
      <div className="v2-cards-row">
        {topCards.map((card, i) => (
          <Link to={card.link} className="v2-metric-card v2-metric-link" key={i}>
            <div className="v2-metric-top">
              <div className="v2-metric-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
              <div>
                <div className="v2-metric-label">{card.label}</div>
                <div className="v2-metric-sub">{card.sub}</div>
              </div>
            </div>
            <div className="v2-metric-bottom">
              <div className="v2-metric-value">{card.value}</div>
              {card.trend && (
                <div className={`v2-trend ${card.trend.up ? 'v2-trend-up' : 'v2-trend-down'}`}>
                  {card.trend.up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                  {card.trend.val}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Middle: Chart + Right Stats ── */}
      <div className="v2-middle-row">

        {/* Line Chart */}
        <div className="v2-chart-card">
          <div className="v2-chart-head">
            <div>
              <div className="v2-card-title">Stock Overview</div>
              <div className="v2-card-sub">Products count by category</div>
            </div>
            <div className="v2-filter-pill">
              <FiSliders size={13} /> This Month
            </div>
          </div>
          <Line data={lineChartData} options={lineChartOptions} height={90} />
        </div>

        {/* Right Stats Column */}
        <div className="v2-right-stats">
          {rightStats.map((s, i) => (
            <div className="v2-right-stat" key={i}>
              <div className="v2-rs-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
              <div className="v2-rs-info">
                <div className="v2-rs-label">{s.label}</div>
                <div className="v2-rs-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Recent Alerts + Store Overview ── */}
      <div className="v2-bottom-row">

        {/* Recent Alerts Table */}
        <div className="v2-table-card">
          <div className="v2-table-head">
            <div>
              <div className="v2-card-title">Recent Alerts</div>
              <div className="v2-card-sub">Products expiring within 7 days</div>
            </div>
            <Link to="/alerts" className="v2-filter-pill">
              <FiSliders size={13} /> View All
            </Link>
          </div>

          {recentAlerts.length > 0 ? (
            <table className="v2-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  {user?.role === 'admin' && <th>Store</th>}
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((p, i) => {
                  const days = p.daysUntilExpiry;
                  return (
                    <tr key={p._id}>
                      <td>
                        <span className="v2-prod-num">#{String(i + 1).padStart(3, '0')}</span>
                        <span className="v2-prod-name">{p.name}</span>
                      </td>
                      <td>{p.category}</td>
                      {user?.role === 'admin' && <td style={{ color: '#6b7280', fontSize: 12 }}>{p.store?.name || '—'}</td>}
                      <td>{new Date(p.expiryDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: days < 0 ? '#ef4444' : days <= 3 ? '#d97706' : '#374151' }}>
                        {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                      </td>
                      <td>{getStatusBadge(p.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="v2-empty">
              <FiCheckCircle size={32} style={{ color: '#00897b' }} />
              <p>All products are safe — no alerts!</p>
            </div>
          )}
        </div>

        {/* Admin: Store Overview */}
        {user?.role === 'admin' && storeSummary.length > 0 && (
          <div className="v2-store-panel">
            <div className="v2-card-title" style={{ marginBottom: 16 }}>
              <FiMapPin size={14} style={{ marginRight: 6, color: '#00897b' }} />
              Store Overview
            </div>
            <div className="v2-store-list">
              {storeSummary.map(store => {
                const safeN = (store.totalProducts || 0) - (store.expiringSoon || 0) - (store.expiredProducts || 0);
                const sp = store.totalProducts ? Math.round((safeN / store.totalProducts) * 100) : 0;
                return (
                  <div className="v2-store-item" key={store._id}>
                    <div className="v2-store-name">{store.name}</div>
                    <div className="v2-store-nums">
                      <span style={{ color: '#00897b' }}>{store.totalProducts || 0} items</span>
                      {store.expiringSoon > 0 && <span style={{ color: '#d97706' }}>· {store.expiringSoon} expiring</span>}
                      {store.expiredProducts > 0 && <span style={{ color: '#ef4444' }}>· {store.expiredProducts} expired</span>}
                    </div>
                    <div className="v2-store-bar">
                      <div style={{ width: sp + '%' }} />
                    </div>
                    <div className="v2-store-pct">{sp}% safe</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
