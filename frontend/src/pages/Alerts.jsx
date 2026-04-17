import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiAlertTriangle, FiAlertCircle, FiClock, FiSearch, FiChevronDown, FiPackage, FiShield, FiTrendingDown, FiFilter, FiDollarSign } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Alerts() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertDays, setAlertDays] = useState(7);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [alertDays]);

  const fetchAlerts = async () => {
    try {
      const { data } = await API.get(`/products/alerts?days=${alertDays}`);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const expired = alerts.filter(p => p.daysUntilExpiry < 0);
  const expiresToday = alerts.filter(p => p.daysUntilExpiry === 0);
  const expiringSoon = alerts.filter(p => p.daysUntilExpiry > 0);

  const totalLoss = expired.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const atRiskValue = expiringSoon.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const criticalCount = expiringSoon.filter(p => p.daysUntilExpiry <= 3).length;

  // Filter by active tab
  const getTabData = () => {
    if (activeTab === 'expired') return expired;
    if (activeTab === 'today') return expiresToday;
    if (activeTab === 'soon') return expiringSoon;
    return alerts;
  };

  // Search filter
  const filteredData = getTabData().filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.store?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Priority tag
  const getPriorityTag = (days) => {
    if (days < 0) return <span className="al-priority al-priority-critical">Expired</span>;
    if (days === 0) return <span className="al-priority al-priority-urgent">Today</span>;
    if (days <= 3) return <span className="al-priority al-priority-high">High</span>;
    if (days <= 7) return <span className="al-priority al-priority-medium">Medium</span>;
    return <span className="al-priority al-priority-low">Low</span>;
  };

  // Days display
  const getDaysDisplay = (days) => {
    if (days < 0) return <span className="al-days al-days-expired">{Math.abs(days)}d overdue</span>;
    if (days === 0) return <span className="al-days al-days-today">Today</span>;
    return <span className="al-days al-days-soon">{days}d left</span>;
  };

  // Progress ring for urgency
  const getUrgencyRing = (days) => {
    const maxDays = alertDays;
    const pct = days < 0 ? 100 : days === 0 ? 100 : Math.max(0, Math.min(100, ((maxDays - days) / maxDays) * 100));
    const color = days < 0 ? '#ef4444' : days === 0 ? '#f59e0b' : days <= 3 ? '#f97316' : '#00897b';
    const r = 14;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 18 18)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="18" y="19" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="9" fontWeight="700">
          {days < 0 ? '!' : days}
        </text>
      </svg>
    );
  };

  if (loading) return (
    <div className="al-root">
      <div className="al-loading">
        <div className="al-loading-spinner" />
        <p>Loading alerts...</p>
      </div>
    </div>
  );

  const tabs = [
    { key: 'all', label: 'All Alerts', count: alerts.length, color: '#00897b' },
    { key: 'expired', label: 'Expired', count: expired.length, color: '#ef4444' },
    { key: 'today', label: 'Expires Today', count: expiresToday.length, color: '#f59e0b' },
    { key: 'soon', label: 'Expiring Soon', count: expiringSoon.length, color: '#00897b' },
  ];

  return (
    <div className="al-root">

      {/* ── Header ── */}
      <div className="al-header">
        <div className="al-header-left">
          <div className="al-header-icon">
            <FiAlertTriangle size={22} />
          </div>
          <div>
            <h1 className="al-title">Expiry Alerts</h1>
            <p className="al-subtitle">
              {alerts.length > 0
                ? <>{alerts.length} product{alerts.length !== 1 && 's'} need attention</>
                : 'All products are safe'
              }
            </p>
          </div>
        </div>
        <div className="al-header-right">
          <div className="al-window-select">
            <FiClock size={14} />
            <select value={alertDays} onChange={e => setAlertDays(Number(e.target.value))}>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={15}>15 days</option>
              <option value={30}>30 days</option>
            </select>
            <FiChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="al-metrics">
        <div className="al-metric-card al-metric-red">
          <div className="al-metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <FiAlertCircle size={20} />
          </div>
          <div className="al-metric-body">
            <div className="al-metric-value">{expired.length}</div>
            <div className="al-metric-label">Already Expired</div>
          </div>
          {expired.length > 0 && (
            <div className="al-metric-badge al-badge-red">
              <FiTrendingDown size={11} /> Rs.{totalLoss.toLocaleString('en-IN')} loss
            </div>
          )}
        </div>

        <div className="al-metric-card al-metric-amber">
          <div className="al-metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <FiAlertTriangle size={20} />
          </div>
          <div className="al-metric-body">
            <div className="al-metric-value">{expiresToday.length}</div>
            <div className="al-metric-label">Expires Today</div>
          </div>
          {expiresToday.length > 0 && (
            <div className="al-metric-badge al-badge-amber">Action needed</div>
          )}
        </div>

        <div className="al-metric-card al-metric-teal">
          <div className="al-metric-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
            <FiClock size={20} />
          </div>
          <div className="al-metric-body">
            <div className="al-metric-value">{expiringSoon.length}</div>
            <div className="al-metric-label">Expiring in {alertDays}d</div>
          </div>
          {criticalCount > 0 && (
            <div className="al-metric-badge al-badge-orange">{criticalCount} critical</div>
          )}
        </div>

        <div className="al-metric-card al-metric-purple">
          <div className="al-metric-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <FiDollarSign size={20} />
          </div>
          <div className="al-metric-body">
            <div className="al-metric-value">Rs.{(totalLoss + atRiskValue).toLocaleString('en-IN')}</div>
            <div className="al-metric-label">Total at Risk</div>
          </div>
          <div className="al-metric-badge al-badge-purple">
            Rs.{atRiskValue.toLocaleString('en-IN')} preventable
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="al-table-card">

        {/* Tabs */}
        <div className="al-tabs-bar">
          <div className="al-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`al-tab ${activeTab === tab.key ? 'al-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="al-tab-count" style={activeTab === tab.key ? { background: tab.color, color: 'white' } : {}}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="al-tab-search">
            <FiSearch size={14} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <div className="al-empty">
            <div className="al-empty-icon">
              <FiShield size={40} />
            </div>
            <h3>{search ? 'No products match your search' : 'All Clear!'}</h3>
            <p>{search ? 'Try a different search term' : `No ${activeTab === 'all' ? '' : activeTab} alerts within the ${alertDays}-day window.`}</p>
          </div>
        ) : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Urgency</th>
                  <th>Product</th>
                  <th>Category</th>
                  {user?.role === 'admin' && <th>Store</th>}
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Expiry Date</th>
                  <th>Time Left</th>
                  <th>Priority</th>
                  <th>Loss / Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((p, idx) => {
                  const loss = p.price * p.quantity;
                  return (
                    <tr key={p._id} className={p.daysUntilExpiry < 0 ? 'al-row-expired' : p.daysUntilExpiry === 0 ? 'al-row-today' : p.daysUntilExpiry <= 3 ? 'al-row-critical' : ''}>
                      <td>
                        <div className="al-urgency-cell">
                          {getUrgencyRing(p.daysUntilExpiry)}
                        </div>
                      </td>
                      <td>
                        <div className="al-product-cell">
                          <div className="al-product-name">{p.name}</div>
                          {p.brand && <div className="al-product-brand">{p.brand}</div>}
                        </div>
                      </td>
                      <td>
                        <span className="al-category-tag">{p.category}</span>
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <span className="al-store-name">{p.store?.name || '—'}</span>
                        </td>
                      )}
                      <td>
                        <span className="al-qty">{p.quantity}</span>
                      </td>
                      <td>
                        <span className="al-price">Rs.{p.price}</span>
                      </td>
                      <td>
                        <span className="al-date">{new Date(p.expiryDate).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td>{getDaysDisplay(p.daysUntilExpiry)}</td>
                      <td>{getPriorityTag(p.daysUntilExpiry)}</td>
                      <td>
                        <span className={`al-loss ${p.daysUntilExpiry < 0 ? 'al-loss-red' : 'al-loss-muted'}`}>
                          Rs.{loss.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredData.length > 0 && (
          <div className="al-table-footer">
            <span>Showing {filteredData.length} of {alerts.length} alerts</span>
            <span className="al-footer-loss">
              Total loss/risk: <strong>Rs.{filteredData.reduce((s, p) => s + p.price * p.quantity, 0).toLocaleString('en-IN')}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
