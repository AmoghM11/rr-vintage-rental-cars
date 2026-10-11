import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Loader({ progress, ready, onDone }) {
  const root = useRef(null)
  const [shown, setShown] = useState(0)
  const done = useRef(false)
  const start = useRef(performance.now())
  const v = useRef(0)

  useEffect(() => {
    let raf
    const tick = () => {
      const t = (performance.now() - start.current) / 1000
      const target = ready ? 100 : Math.min(94, Math.max(progress * 92, Math.min(45, t * 18)))
      v.current += (target - v.current) * 0.08
      setShown(v.current)
      if (ready && v.current > 99.4 && t > 1.6 && !done.current) {
        done.current = true
        setShown(100)
        const tl = gsap.timeline({ onComplete: onDone })
        tl.to('.ld-content', { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.in' })
          .to('.ld-top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
          .to('.ld-bot', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
          .set(root.current, { display: 'none' })
        return
      }
      if (!done.current) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress, ready, onDone])

  return (
    <div ref={root} className="fixed inset-0 z-[80]" role="status" aria-label="Loading">
      <div className="ld-top absolute inset-x-0 top-0 h-1/2 bg-night" />
      <div className="ld-bot absolute inset-x-0 bottom-0 h-1/2 bg-night" />
      <div className="ld-content absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <svg viewBox="0 0 120 120" className="h-28 w-28 text-gold-light" aria-hidden="true">
          <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
          <circle
            cx="60"
            cy="60"
            r="57"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - shown / 100}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="72" textAnchor="middle" fontFamily="Italiana, serif" fontSize="40" fill="currentColor">
            RR
          </text>
        </svg>
        <p className="kicker mt-9">Vintage Rental Cars</p>
        <p className="mt-3 font-serif text-lg italic text-ivory/60">Polishing the chrome…</p>
        <div className="mt-8 h-px w-56 bg-ivory/10">
          <div className="h-full origin-left bg-gold-light" style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <p className="mt-3 text-xs tracking-[0.45em] text-ivory/50">{String(Math.round(shown)).padStart(3, '0')}</p>
      </div>
    </div>
  )
}
