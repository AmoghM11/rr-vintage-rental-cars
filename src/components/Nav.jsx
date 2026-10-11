import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'

const LEFT = [
  ['The Fleet', '#fleet'],
  ['Our Story', '#story'],
  ['Occasions', '#occasions'],
]
const RIGHT = [
  ['Process', '#process'],
  ['Gallery', '#gallery'],
]

export default function Nav({ lenisRef }) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const overlay = useRef(null)

  useEffect(() => {
    let last = 0
    const on = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (y > last + 4 && y > 500) setHidden(true)
      else if (y < last - 4) setHidden(false)
      last = y
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    if (open && overlay.current) {
      lenisRef.current?.stop()
      gsap.fromTo(overlay.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
      gsap.fromTo(
        overlay.current.querySelectorAll('[data-m]'),
        { yPercent: 120 },
        { yPercent: 0, stagger: 0.06, duration: 0.9, delay: 0.35, ease: 'expo.out' },
      )
    } else lenisRef.current?.start()
  }, [open, lenisRef])

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    requestAnimationFrame(() => lenisRef.current?.scrollTo(href, { duration: 1.8 }))
  }

  const link = ([label, href]) => (
    <a
      key={href}
      href={href}
      onClick={(e) => go(e, href)}
      className="group relative py-2 text-[0.74rem] font-medium uppercase tracking-[0.3em] text-ivory/80 transition-colors hover:text-gold-pale"
    >
      {label}
      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-gold-light transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
    </a>
  )

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${hidden && !open ? '-translate-y-full' : ''} ${
          scrolled ? 'bg-night/70 py-3 backdrop-blur-xl' : 'py-6'
        }`}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto] items-center px-5 md:px-10 lg:grid-cols-[1fr_auto_1fr]">
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {LEFT.map(link)}
          </nav>
          <a href="#top" onClick={(e) => go(e, '#top')} aria-label="RR Vintage Rental Cars, home">
            <Logo />
          </a>
          <div className="flex items-center justify-end gap-9">
            <nav className="hidden items-center gap-9 lg:flex" aria-label="Secondary">
              {RIGHT.map(link)}
            </nav>
            <a href="#book" onClick={(e) => go(e, '#book')} className="btn-gold hidden !px-5 !py-3 sm:inline-flex">
              Book a date
            </a>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center border border-gold-light/40 text-ivory lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div ref={overlay} className="fixed inset-0 z-40 flex flex-col justify-center bg-night px-8 lg:hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(circle at 70% 20%, rgba(142,107,54,.5), transparent 60%)' }}
          />
          <nav className="relative flex flex-col gap-4" aria-label="Mobile">
            {[...LEFT, ...RIGHT, ['Book a date', '#book']].map(([label, href], i) => (
              <div key={href} className="overflow-hidden">
                <a data-m href={href} onClick={(e) => go(e, href)} className="display flex items-baseline gap-5 text-[2.6rem] text-ivory">
                  <span className="font-sans text-xs tracking-[0.3em] text-gold-light">0{i + 1}</span>
                  {label}
                </a>
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
