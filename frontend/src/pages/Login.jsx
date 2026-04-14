import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Logo from '../assets/Logo';

export default function Login() {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(form);
        toast.success('Account created successfully!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page">
      {/* Left Side — Branding + Illustration */}
      <div className="login-left">
        <div className="login-brand anim-fadeIn">
          <Logo size={38} textColor="#00897b" />
        </div>

        <h1 className="login-hero-title anim-slideRight">
          Track Your<br />
          Product <span className="highlight">Expiry</span>
        </h1>

        {/* SVG Illustration — Inventory Team */}
        <div className="login-illustration anim-slideUp">
          <svg viewBox="0 0 500 380" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* Shelf / Background */}
            <rect className="anim-shelf" x="60" y="280" width="380" height="8" rx="4" fill="#b2dfdb"/>
            <rect className="anim-shelf" x="80" y="200" width="340" height="6" rx="3" fill="#b2dfdb"/>

            {/* Boxes on shelf — staggered pop in */}
            <g className="anim-box box-1">
              <rect x="100" y="220" width="50" height="55" rx="6" fill="#ff8a65" stroke="#e64a19" strokeWidth="1.5"/>
              <rect x="108" y="228" width="34" height="8" rx="2" fill="#ffccbc"/>
              <text x="125" y="262" textAnchor="middle" fontSize="9" fill="white" fontWeight="600">MILK</text>
            </g>

            <g className="anim-box box-2">
              <rect x="170" y="230" width="45" height="45" rx="6" fill="#4db6ac" stroke="#00897b" strokeWidth="1.5"/>
              <rect x="178" y="238" width="29" height="8" rx="2" fill="#b2dfdb"/>
              <text x="192" y="262" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">RICE</text>
            </g>

            <g className="anim-box box-3">
              <rect x="235" y="215" width="55" height="60" rx="6" fill="#7986cb" stroke="#3949ab" strokeWidth="1.5"/>
              <rect x="243" y="223" width="39" height="8" rx="2" fill="#c5cae9"/>
              <text x="262" y="258" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">JUICE</text>
            </g>

            <g className="anim-box box-4">
              <rect x="310" y="225" width="48" height="50" rx="6" fill="#ffb74d" stroke="#f57c00" strokeWidth="1.5"/>
              <rect x="318" y="233" width="32" height="8" rx="2" fill="#ffe0b2"/>
              <text x="334" y="262" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">SNACK</text>
            </g>

            <g className="anim-box box-5">
              <rect x="375" y="235" width="40" height="40" rx="6" fill="#e57373" stroke="#c62828" strokeWidth="1.5"/>
              <text x="395" y="260" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">TEA</text>
            </g>

            {/* Person 1 — Woman with clipboard */}
            <g className="anim-person person-1">
              <ellipse cx="155" cy="145" rx="22" ry="22" fill="#ffcc80"/>
              <circle cx="155" cy="120" r="24" fill="#5d4037"/>
              <circle cx="155" cy="123" r="20" fill="#ffcc80"/>
              <circle cx="148" cy="119" r="2.5" fill="#3e2723"/>
              <circle cx="162" cy="119" r="2.5" fill="#3e2723"/>
              <path d="M149 128 Q155 134 161 128" stroke="#3e2723" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M131 115 Q135 90 155 88 Q175 90 179 115" fill="#3e2723"/>
              <path d="M135 145 Q130 180 128 280 L182 280 Q180 180 175 145 Z" fill="#00897b"/>
              <path d="M135 160 Q115 175 120 200" stroke="#ffcc80" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M175 160 Q190 175 195 195" stroke="#ffcc80" strokeWidth="8" fill="none" strokeLinecap="round"/>
              {/* Clipboard */}
              <g className="anim-clipboard">
                <rect x="110" y="190" width="25" height="32" rx="3" fill="white" stroke="#00897b" strokeWidth="1.5"/>
                <rect x="114" y="198" width="17" height="2.5" rx="1" fill="#b2dfdb"/>
                <rect x="114" y="203" width="17" height="2.5" rx="1" fill="#b2dfdb"/>
                <rect x="114" y="208" width="12" height="2.5" rx="1" fill="#b2dfdb"/>
              </g>
              <rect x="138" y="270" width="12" height="18" rx="4" fill="#ffcc80"/>
              <rect x="158" y="270" width="12" height="18" rx="4" fill="#ffcc80"/>
              <rect x="135" y="284" width="18" height="8" rx="4" fill="#3e2723"/>
              <rect x="155" y="284" width="18" height="8" rx="4" fill="#3e2723"/>
            </g>

            {/* Person 2 — Man with scanner */}
            <g className="anim-person person-2">
              <circle cx="280" cy="123" r="20" fill="#ffcc80"/>
              <circle cx="273" cy="119" r="2.5" fill="#3e2723"/>
              <circle cx="287" cy="119" r="2.5" fill="#3e2723"/>
              <path d="M274 128 Q280 133 286 128" stroke="#3e2723" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M260 115 Q265 98 280 96 Q295 98 300 115" fill="#212121"/>
              <path d="M260 145 Q255 180 252 280 L308 280 Q305 180 300 145 Z" fill="#1565c0"/>
              <path d="M268 145 L280 158 L292 145" fill="#0d47a1"/>
              <path d="M260 155 Q240 175 238 200" stroke="#ffcc80" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M300 155 Q315 170 325 185" stroke="#ffcc80" strokeWidth="8" fill="none" strokeLinecap="round"/>
              {/* Scanner */}
              <g className="anim-scanner">
                <rect x="318" y="178" width="18" height="28" rx="3" fill="#37474f" stroke="#263238" strokeWidth="1"/>
                <rect x="322" y="183" width="10" height="12" rx="1" fill="#4fc3f7"/>
                <line className="scanner-beam" x1="327" y1="198" x2="327" y2="203" stroke="#f44336" strokeWidth="2"/>
              </g>
              <rect x="262" y="270" width="12" height="18" rx="4" fill="#ffcc80"/>
              <rect x="282" y="270" width="12" height="18" rx="4" fill="#ffcc80"/>
              <rect x="259" y="284" width="18" height="8" rx="4" fill="#37474f"/>
              <rect x="279" y="284" width="18" height="8" rx="4" fill="#37474f"/>
            </g>

            {/* Floating badges — animated */}
            <g className="anim-badge badge-1">
              <rect x="30" y="70" width="72" height="32" rx="16" fill="white" filter="url(#shadow)"/>
              <circle cx="50" cy="86" r="10" fill="#fff3e0"/>
              <text x="50" y="90" textAnchor="middle" fontSize="12" fill="#f57c00">!</text>
              <text x="78" y="90" textAnchor="middle" fontSize="9" fill="#37474f" fontWeight="600">3 Alert</text>
            </g>

            <g className="anim-badge badge-2">
              <rect x="370" y="60" width="85" height="32" rx="16" fill="white" filter="url(#shadow)"/>
              <circle cx="390" cy="76" r="10" fill="#e8f5e9"/>
              <text x="390" y="80" textAnchor="middle" fontSize="12" fill="#2e7d32">✓</text>
              <text x="425" y="80" textAnchor="middle" fontSize="9" fill="#37474f" fontWeight="600">42 Safe</text>
            </g>

            <g className="anim-badge badge-3">
              <rect x="340" y="140" width="95" height="32" rx="16" fill="white" filter="url(#shadow)"/>
              <circle cx="360" cy="156" r="10" fill="#ffebee"/>
              <text x="360" y="160" textAnchor="middle" fontSize="11" fill="#c62828">✕</text>
              <text x="400" y="160" textAnchor="middle" fontSize="9" fill="#37474f" fontWeight="600">5 Expired</text>
            </g>

            <defs>
              <filter id="shadow" x="-4" y="-2" width="110%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1"/>
              </filter>
            </defs>
          </svg>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="login-right">
        <div className="login-form-wrapper anim-fadeIn-delay">
          <h1 className="login-title">
            {isRegister ? 'Create Account' : 'Welcome to Smart Inventory'}
          </h1>
          <p className="login-subtitle">
            {isRegister
              ? 'Start managing your inventory smartly.'
              : 'Track Your Product Expiry'
            }
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="login-field">
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div className="login-field">
              <label className="field-label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="login-field">
              <label className="field-label">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {!isRegister && (
              <div style={{ textAlign: 'right', marginBottom: 6 }}>
                <span className="login-link" style={{ fontSize: 13 }}>Forgot password?</span>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Login')}
            </button>
          </form>

          <p className="login-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); }}
              className="login-link"
            >
              {isRegister ? 'Login' : 'Register'}
            </a>
          </p>
        </div>

        <p className="login-footer">&copy; 2026 all rights reserved</p>
      </div>
    </div>
  );
}
