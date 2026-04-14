export default function Logo({ size = 36, showText = true, textColor = '#16a34a', dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
      {/* Icon — Black rounded square with white wave lines */}
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="16" fill={dark ? '#1f2937' : '#111827'} />
        {/* Wave lines */}
        <path d="M20 28 Q30 22, 40 28 Q50 34, 60 28" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M20 38 Q30 32, 40 38 Q50 44, 60 38" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M20 48 Q30 42, 40 48 Q50 54, 60 48" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M24 56 Q34 50, 44 56 Q52 61, 56 56" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>

      {showText && (
        <span style={{
          fontSize: size * 0.5,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}>
          smart inventory
        </span>
      )}
    </div>
  );
}
