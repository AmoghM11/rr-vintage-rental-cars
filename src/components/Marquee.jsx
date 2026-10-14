import { useEffect, useRef } from 'react'

const WORDS = ['Rolls-Royce', 'MG', 'Morgan', 'Marry Vintage']

function Row({ outline, reverse }) {
  const items = [...WORDS, ...WORDS]
  return (
    <div className={`marquee-track ${reverse ? 'reverse' : ''}`}>
      {items.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={`display whitespace-nowrap px-8 text-[clamp(3rem,8vw,7.5rem)] uppercase ${outline ? 'outline-text' : 'text-ivory'}`}>{w}</span>
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-gold-light" aria-hidden="true">
            <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor" />
          </svg>
        </span>
      ))}
    </div>
  )
}

// The rows glide on the compositor (pure CSS transform). Large lettering is expensive to redraw,
// so nothing here changes per scroll frame, and the loop pauses whenever the band is off-screen.
export default function Marquee() {
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-paused', !e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section ref={root} className="marquee relative z-10 overflow-hidden border-y border-gold/25 bg-night py-10" aria-label="Our fleet">
      <Row />
      <div className="mt-2">
        <Row outline reverse />
      </div>
    </section>
  )
}
