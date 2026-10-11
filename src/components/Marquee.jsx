import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const WORDS = ['Rolls-Royce', 'MG', 'Morgan', 'Marry Vintage']

function Row({ outline, reverse }) {
  const items = [...WORDS, ...WORDS, ...WORDS, ...WORDS]
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

export default function Marquee() {
  const root = useRef(null)
  useEffect(() => {
    const skew = gsap.quickTo(root.current.querySelectorAll('[data-skew]'), 'skewX', { duration: 0.5, ease: 'power3' })
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => skew(gsap.utils.clamp(-12, 12, self.getVelocity() / -260)),
    })
    return () => st.kill()
  }, [])
  return (
    <section ref={root} className="relative z-10 overflow-hidden border-y border-gold/25 bg-night py-10" aria-label="Our fleet">
      <div data-skew>
        <Row />
      </div>
      <div data-skew className="mt-2">
        <Row outline reverse />
      </div>
    </section>
  )
}
