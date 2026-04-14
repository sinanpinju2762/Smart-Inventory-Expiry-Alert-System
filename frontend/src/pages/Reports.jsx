import { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FiDownload, FiTrendingDown, FiTrendingUp, FiCalendar, FiFileText, FiChevronDown, FiPieChart, FiDollarSign, FiPackage, FiAlertCircle, FiBarChart2, FiCheckCircle } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    fetchTrend();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/monthly?month=${month}&year=${year}`);
      setReport(data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      const { data } = await API.get('/reports/trend');
      setTrend(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTrendLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await API.get(`/reports/monthly/pdf?month=${month}&year=${year}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expiry-report-${year}-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ── Trend Chart Data ──
  const trendChartData = trend.length > 0 ? {
    labels: trend.map(t => t.month),
    datasets: [{
      label: 'Loss (Rs.)',
      data: trend.map(t => t.totalLoss),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.08)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointBackgroundColor: '#ef4444',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  } : null;

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: ctx => `Loss: Rs.${ctx.parsed.y.toLocaleString('en-IN')}` }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: '500' }, color: '#9ca3af' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 }, color: '#9ca3af', callback: v => `Rs.${v.toLocaleString('en-IN')}` }
      }
    }
  };

  // ── Category Doughnut ──
  const catColors = ['#00897b', '#ef4444', '#f59e0b', '#7c3aed', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#e11d48', '#8b5cf6'];

  const doughnutData = report && report.categoryBreakdown.length > 0 ? {
    labels: report.categoryBreakdown.map(c => c._id),
    datasets: [{
      data: report.categoryBreakdown.map(c => c.totalLoss),
      backgroundColor: report.categoryBreakdown.map((_, i) => catColors[i % catColors.length]),
      borderWidth: 0,
      hoverOffset: 6,
    }]
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        cornerRadius: 8,
        padding: 10,
        callbacks: { label: ctx => `${ctx.label}: Rs.${ctx.parsed.toLocaleString('en-IN')}` }
      }
    }
  };

  // ── Loss trend stats ──
  const totalTrendLoss = trend.reduce((s, t) => s + t.totalLoss, 0);
  const lastMonthLoss = trend.length >= 1 ? trend[trend.length - 1].totalLoss : 0;
  const prevMonthLoss = trend.length >= 2 ? trend[trend.length - 2].totalLoss : 0;
  const trendPctChange = prevMonthLoss > 0 ? (((lastMonthLoss - prevMonthLoss) / prevMonthLoss) * 100).toFixed(1) : 0;
  const peakLoss = trend.length > 0 ? Math.max(...trend.map(t => t.totalLoss)) : 0;

  // ── Category bar breakdown ──
  const maxCatLoss = report ? Math.max(...report.categoryBreakdown.map(c => c.totalLoss), 1) : 1;

  return (
    <div className="rp-root">

      {/* ── Header ── */}
      <div className="rp-header">
        <div className="rp-header-left">
          <div className="rp-header-icon">
            <FiBarChart2 size={22} />
          </div>
          <div>
            <h1 className="rp-title">Reports & Analytics</h1>
            <p className="rp-subtitle">Track expiry losses, trends, and category breakdowns</p>
          </div>
        </div>
      </div>

      {/* ── Trend Section ── */}
      <div className="rp-trend-row">
        {/* Trend Chart */}
        <div className="rp-card rp-trend-chart">
          <div className="rp-card-head">
            <div>
              <div className="rp-card-title">
                <FiTrendingDown size={16} style={{ color: '#ef4444' }} /> Loss Trend
              </div>
              <div className="rp-card-sub">Last 6 months overview</div>
            </div>
          </div>
          {trendLoading ? (
            <div className="rp-chart-placeholder">
              <div className="al-loading-spinner" />
            </div>
          ) : trendChartData ? (
            <div style={{ height: 220 }}>
              <Line data={trendChartData} options={trendOptions} />
            </div>
          ) : (
            <div className="rp-chart-placeholder">
              <FiBarChart2 size={32} style={{ color: '#d1d5db' }} />
              <p>No trend data available yet</p>
            </div>
          )}
        </div>

        {/* Trend Stats */}
        <div className="rp-trend-stats">
          <div className="rp-mini-card">
            <div className="rp-mini-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <FiDollarSign size={18} />
            </div>
            <div>
              <div className="rp-mini-label">6-Month Total Loss</div>
              <div className="rp-mini-value">Rs.{totalTrendLoss.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="rp-mini-card">
            <div className="rp-mini-icon" style={{ background: lastMonthLoss > prevMonthLoss ? '#fef2f2' : '#dcfce7', color: lastMonthLoss > prevMonthLoss ? '#ef4444' : '#16a34a' }}>
              {lastMonthLoss > prevMonthLoss ? <FiTrendingUp size={18} /> : <FiTrendingDown size={18} />}
            </div>
            <div>
              <div className="rp-mini-label">Month-over-Month</div>
              <div className="rp-mini-value" style={{ color: trendPctChange > 0 ? '#ef4444' : '#16a34a' }}>
                {trendPctChange > 0 ? '+' : ''}{trendPctChange}%
              </div>
            </div>
          </div>
          <div className="rp-mini-card">
            <div className="rp-mini-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <FiAlertCircle size={18} />
            </div>
            <div>
              <div className="rp-mini-label">Peak Monthly Loss</div>
              <div className="rp-mini-value">Rs.{peakLoss.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="rp-mini-card">
            <div className="rp-mini-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
              <FiCalendar size={18} />
            </div>
            <div>
              <div className="rp-mini-label">Avg. Monthly Loss</div>
              <div className="rp-mini-value">Rs.{trend.length > 0 ? Math.round(totalTrendLoss / trend.length).toLocaleString('en-IN') : '0'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Generator ── */}
      <div className="rp-card rp-generator">
        <div className="rp-gen-head">
          <div>
            <div className="rp-card-title"><FiFileText size={16} /> Generate Monthly Report</div>
            <div className="rp-card-sub">Select a month and year to generate a detailed expiry report</div>
          </div>
        </div>
        <div className="rp-gen-controls">
          <div className="rp-gen-select-group">
            <div className="rp-gen-select">
              <FiCalendar size={14} />
              <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <FiChevronDown size={14} />
            </div>
            <div className="rp-gen-select">
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <FiChevronDown size={14} />
            </div>
          </div>
          <div className="rp-gen-actions">
            <button className="rp-gen-btn" onClick={fetchReport} disabled={loading}>
              {loading ? (
                <><div className="al-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
              ) : (
                <><FiBarChart2 size={15} /> Generate Report</>
              )}
            </button>
            {report && (
              <button className="rp-pdf-btn" onClick={downloadPDF}>
                <FiDownload size={15} /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Report Results ── */}
      {report && (
        <>
          {/* Summary Metrics */}
          <div className="rp-result-metrics">
            <div className="rp-result-card">
              <div className="rp-result-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <FiPackage size={20} />
              </div>
              <div>
                <div className="rp-result-value">{report.totalExpired}</div>
                <div className="rp-result-label">Products Expired</div>
              </div>
            </div>
            <div className="rp-result-card">
              <div className="rp-result-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <FiDollarSign size={20} />
              </div>
              <div>
                <div className="rp-result-value rp-loss-value">Rs.{report.totalLoss.toLocaleString('en-IN')}</div>
                <div className="rp-result-label">Total Loss</div>
              </div>
            </div>
            <div className="rp-result-card">
              <div className="rp-result-icon" style={{ background: '#e6f4f1', color: '#00897b' }}>
                <FiPieChart size={20} />
              </div>
              <div>
                <div className="rp-result-value">{report.categoryBreakdown.length}</div>
                <div className="rp-result-label">Categories Affected</div>
              </div>
            </div>
            <div className="rp-result-card">
              <div className="rp-result-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                <FiCalendar size={20} />
              </div>
              <div>
                <div className="rp-result-value">{monthNames[report.month - 1]}</div>
                <div className="rp-result-label">{report.year}</div>
              </div>
            </div>
          </div>

          {/* Category Section — Doughnut + Bar Breakdown */}
          {report.categoryBreakdown.length > 0 && (
            <div className="rp-cat-row">
              {/* Doughnut */}
              <div className="rp-card rp-doughnut-card">
                <div className="rp-card-head">
                  <div className="rp-card-title"><FiPieChart size={16} /> Loss by Category</div>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
                </div>
                {/* Legend */}
                <div className="rp-doughnut-legend">
                  {report.categoryBreakdown.map((cat, i) => (
                    <div className="rp-legend-item" key={cat._id}>
                      <span className="rp-legend-dot" style={{ background: catColors[i % catColors.length] }} />
                      <span className="rp-legend-label">{cat._id}</span>
                      <span className="rp-legend-value">Rs.{cat.totalLoss.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Bar Breakdown */}
              <div className="rp-card rp-cat-breakdown">
                <div className="rp-card-head">
                  <div className="rp-card-title"><FiBarChart2 size={16} /> Category Breakdown</div>
                </div>
                <div className="rp-cat-bars">
                  {report.categoryBreakdown.map((cat, i) => {
                    const pct = report.totalLoss > 0 ? ((cat.totalLoss / report.totalLoss) * 100).toFixed(1) : 0;
                    const barW = Math.max(4, (cat.totalLoss / maxCatLoss) * 100);
                    return (
                      <div className="rp-cat-bar-row" key={cat._id}>
                        <div className="rp-cat-bar-info">
                          <span className="rp-cat-bar-name">{cat._id}</span>
                          <span className="rp-cat-bar-stats">{cat.count} items · {pct}%</span>
                        </div>
                        <div className="rp-cat-bar-track">
                          <div
                            className="rp-cat-bar-fill"
                            style={{ width: barW + '%', background: catColors[i % catColors.length] }}
                          />
                        </div>
                        <span className="rp-cat-bar-amount">Rs.{cat.totalLoss.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Expired Products Table */}
          {report.expiredProducts.length > 0 && (
            <div className="rp-card rp-products-table">
              <div className="rp-card-head" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
                <div>
                  <div className="rp-card-title"><FiAlertCircle size={16} style={{ color: '#ef4444' }} /> Expired Products</div>
                  <div className="rp-card-sub">{report.expiredProducts.length} product{report.expiredProducts.length !== 1 && 's'} expired in {monthNames[report.month - 1]} {report.year}</div>
                </div>
                <span className="rp-products-count">{report.expiredProducts.length}</span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Expiry Date</th>
                      <th>Loss (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expiredProducts.map((p, i) => (
                      <tr key={p._id}>
                        <td>
                          <span className="rp-row-num">{String(i + 1).padStart(2, '0')}</span>
                        </td>
                        <td>
                          <div className="rp-prod-name">{p.name}</div>
                          {p.brand && <div className="rp-prod-brand">{p.brand}</div>}
                        </td>
                        <td><span className="rp-cat-tag">{p.category}</span></td>
                        <td><span className="rp-qty">{p.quantity}</span></td>
                        <td>Rs.{p.price}</td>
                        <td className="rp-date">{new Date(p.expiryDate).toLocaleDateString('en-IN')}</td>
                        <td><span className="rp-loss-cell">Rs.{(p.price * p.quantity).toLocaleString('en-IN')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Table Footer */}
              <div className="rp-table-footer">
                <span>{report.expiredProducts.length} expired products</span>
                <span className="rp-table-total">
                  Total Loss: <strong>Rs.{report.totalLoss.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          )}

          {/* No expired products */}
          {report.totalExpired === 0 && (
            <div className="rp-card">
              <div className="rp-empty">
                <div className="rp-empty-icon">
                  <FiCheckCircle size={40} />
                </div>
                <h3>No Expired Products!</h3>
                <p>Great job! No products expired in {monthNames[report.month - 1]} {report.year}.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Placeholder when no report generated */}
      {!report && !loading && (
        <div className="rp-card rp-placeholder">
          <div className="rp-empty">
            <div className="rp-empty-icon rp-empty-icon-teal">
              <FiFileText size={40} />
            </div>
            <h3>Select a Month to Generate Report</h3>
            <p>Choose a month and year above, then click "Generate Report" to view detailed expiry loss analytics.</p>
          </div>
        </div>
      )}
    </div>
  );
}
