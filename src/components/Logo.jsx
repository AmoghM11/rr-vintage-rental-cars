export default function Logo({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-11 w-11 shrink-0 text-gold-light" aria-hidden="true">
        <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.8" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
        <text x="32" y="40.5" textAnchor="middle" fontFamily="Italiana, serif" fontSize="23" fill="currentColor" letterSpacing="1">
          RR
        </text>
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="display block text-[1.15rem] tracking-[0.24em] text-ivory">RR VINTAGE</span>
          <span className="mt-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.55em] text-gold-light">Rental Cars</span>
        </span>
      )}
    </span>
  )
}
