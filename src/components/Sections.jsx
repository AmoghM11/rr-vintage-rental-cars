import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ArrowRight, ArrowUpRight, CalendarHeart, Car, Check, Clock, LoaderCircle, Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { CARS, GALLERY, HERITAGE, OCCASIONS, SITE, STEPS } from '../data.js'
import Logo from './Logo.jsx'

/* Reusable section heading: kicker + Payana-style spaced display title. */
function Heading({ kicker, title, sub, light = false, align = 'center' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <p data-reveal className={`kicker ${light ? '!text-gold' : ''}`}>
        {kicker}
      </p>
      <h2 data-split className={`display mt-4 text-[clamp(2.6rem,6.5vw,5.4rem)] uppercase ${light ? 'text-night' : 'text-ivory'}`}>
        {title}
      </h2>
      {sub && (
        <p data-reveal className={`mt-4 font-serif text-xl italic md:text-2xl ${light ? 'text-gold' : 'text-gold-pale'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ---------------- Heritage in numbers ---------------- */
export function Heritage() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      root.current.querySelectorAll('[data-countup]').forEach((el) => {
        const to = +el.dataset.countup
        const o = { v: to > 1000 && to < 2100 ? 1800 : 0 }
        gsap.to(o, {
          v: to,
          duration: 2.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => (el.textContent = to >= 10000 ? Math.round(o.v).toLocaleString('en-US') : Math.round(o.v)),
        })
      })
      gsap.fromTo('[data-hline]', { scaleY: 0 }, { scaleY: 1, stagger: 0.15, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 75%' } })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section ref={root} className="relative z-10 bg-coal px-5 py-24 md:py-32" aria-labelledby="heritage-title">
      <div className="mx-auto max-w-[1300px]">
        <div id="heritage-title">
          <Heading kicker="Heritage in numbers" title="A century of craft" sub="The history you are hiring." />
        </div>
        <div className="mt-16 grid grid-cols-2 gap-y-12 md:grid-cols-4">
          {HERITAGE.map((h, i) => (
            <div key={i} className="relative px-4 text-center md:px-8">
              {i > 0 && <span data-hline className="absolute left-0 top-2 hidden h-24 w-px origin-top bg-gold/40 md:block" />}
              <p className="display gold-text text-[clamp(2.8rem,5.5vw,4.8rem)] leading-none">
                <span data-countup={h.num}>0</span>
              </p>
              <p data-reveal className="mx-auto mt-4 max-w-[15rem] text-sm leading-relaxed text-ivory/65">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Occasions ---------------- */
export function Occasions() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-occ]').forEach((row) => {
        const frame = row.querySelector('[data-frame]')
        const img = row.querySelector('img')
        gsap.fromTo(frame.querySelector('[data-cover]'), { scaleX: 1 }, { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: row, start: 'top 75%' } })
        gsap.fromTo(img, { scale: 1.35, yPercent: -8 }, { scale: 1.08, yPercent: 8, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } })
        gsap.fromTo(row.querySelectorAll('[data-item]'), { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 60%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section id="occasions" ref={root} className="relative z-10 bg-ivory px-5 py-24 text-night md:py-36" aria-labelledby="occ-title">
      <div className="mx-auto max-w-[1300px]">
        <div id="occ-title">
          <Heading light kicker="Immerse in the occasion" title="Made for moments" sub="Two reasons people call us." />
        </div>
        <div className="mt-20 space-y-24 md:space-y-36">
          {OCCASIONS.map((o, i) => (
            <div key={o.key} data-occ className={`grid items-center gap-10 md:grid-cols-12 md:gap-16 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div data-frame className="relative aspect-[4/5] overflow-hidden md:col-span-6 md:aspect-[5/6]">
                <img src={o.image} srcSet={o.srcSet} sizes="(min-width: 768px) 46vw, 92vw" alt={o.alt} loading="lazy" decoding="async" className="h-full w-full object-cover will-change-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-night/50 to-transparent" />
                <span className="display absolute bottom-5 left-6 text-6xl text-ivory/90">0{i + 1}</span>
                <div data-cover className={`absolute inset-0 bg-ivory will-change-transform ${i % 2 ? 'origin-left' : 'origin-right'}`} />
              </div>
              <div className="md:col-span-6">
                <p data-reveal className="kicker !text-gold">
                  {o.kicker}
                </p>
                <h3 data-split className="display mt-4 text-[clamp(2.4rem,4.6vw,4rem)] uppercase">
                  {o.title}
                </h3>
                <p data-reveal className="mt-5 max-w-lg text-lg leading-relaxed text-night/70">
                  {o.text}
                </p>
                <ul className="mt-8 border-t border-night/15">
                  {o.items.map((it, k) => (
                    <li key={it} data-item className="group flex items-center justify-between border-b border-night/15 py-4">
                      <span className="flex items-baseline gap-5">
                        <span className="text-xs tracking-[0.3em] text-gold">0{k + 1}</span>
                        <span className="text-xl font-medium transition-transform duration-500 group-hover:translate-x-2">{it}</span>
                      </span>
                      <ArrowUpRight size={18} className="text-gold transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Process: sticky stacked cards ---------------- */
const STEP_ICONS = [Car, CalendarHeart, Sparkles]
export function Process() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('[data-step]')
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return
        // the card stays opaque (so the one beneath never shows through); a shade dims it instead
        const st = { trigger: cards[i + 1], start: 'top bottom', end: 'top 18%', scrub: true }
        gsap.to(card.querySelector('[data-inner]'), { scale: 0.9, ease: 'none', scrollTrigger: st })
        gsap.fromTo(card.querySelector('[data-shade]'), { opacity: 0 }, { opacity: 0.7, ease: 'none', scrollTrigger: { ...st } })
      })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section id="process" ref={root} className="relative z-10 bg-night px-5 py-24 md:py-36" aria-labelledby="process-title">
      <div className="mx-auto max-w-5xl">
        <div id="process-title">
          <Heading kicker="The RR ritual" title="Three steps to the aisle" sub="Simple to book, unforgettable on the day." />
        </div>
        <div className="mt-20">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <div key={s.n} data-step className="sticky top-[14vh] pb-[8vh]">
                <div
                  data-inner
                  className="relative grid min-h-[52vh] origin-top overflow-hidden will-change-transform border border-gold/35 bg-gradient-to-br from-[#16120d] to-[#0b0907] p-8 md:grid-cols-[1fr_1.3fr] md:p-14"
                >
                  <div data-shade className="pointer-events-none absolute inset-0 z-10 bg-night opacity-0 will-change-[opacity]" />
                  <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96" style={{ background: 'radial-gradient(circle, rgba(142,107,54,.16), transparent 65%)' }} />
                  <div className="flex flex-col justify-between">
                    <span className="display text-[7rem] leading-none text-gold/25 md:text-[10rem]">{s.n}</span>
                    <Icon className="mt-6 text-gold-light" size={36} strokeWidth={1.2} />
                  </div>
                  <div className="mt-8 flex flex-col justify-end md:mt-0">
                    <p className="kicker">Step {s.n}</p>
                    <h3 className="display mt-4 text-[clamp(2.2rem,4.5vw,3.6rem)] uppercase text-ivory">{s.title}</h3>
                    <p className="mt-5 max-w-md text-lg leading-relaxed text-ivory/70">{s.text}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Gallery: pinned horizontal strip ---------------- */
export function Gallery() {
  const root = useRef(null)
  const track = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const dist = () => track.current.scrollWidth - window.innerWidth
      const move = gsap.to(track.current, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
      })
      gsap.utils.toArray('[data-gimg]').forEach((img) => {
        gsap.fromTo(img, { xPercent: -12 }, { xPercent: 12, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } })
      })
      gsap.fromTo('[data-gbar]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => '+=' + dist(), scrub: true } })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section id="gallery" ref={root} className="relative z-10 h-[100svh] overflow-hidden bg-coal" aria-labelledby="gallery-title">
      <div className="flex h-full flex-col justify-center gap-10">
        <div className="flex items-end justify-between px-5 md:px-[8vw]">
          <div>
            <p className="kicker">RR in focus</p>
            <h2 id="gallery-title" className="display mt-3 text-[clamp(2.4rem,5.5vw,4.6rem)] uppercase text-ivory">
              Moments in motion
            </h2>
          </div>
          <p className="hidden max-w-xs text-right font-serif text-xl italic text-gold-pale md:block">Ribbons, roads and rolling portraits.</p>
        </div>
        <div ref={track} className="flex w-max gap-5 px-5 will-change-transform md:gap-8 md:px-[8vw]">
          {GALLERY.map((g, i) => (
            <figure key={i} className="group relative h-[52vh] w-[72vw] shrink-0 overflow-hidden sm:w-[46vw] md:w-[30vw]" data-cursor>
              <img data-gimg src={g.src} srcSet={g.srcSet} sizes="(min-width: 768px) 38vw, (min-width: 640px) 58vw, 90vw" alt={g.caption} loading="lazy" decoding="async" className="h-full w-[124%] max-w-none object-cover will-change-transform" style={{ marginLeft: '-12%' }} />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-night/85 to-transparent p-5">
                <span className="font-serif text-lg italic text-ivory">{g.caption}</span>
                <span className="text-xs tracking-[0.3em] text-gold-light">0{i + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mx-5 h-px bg-ivory/10 md:mx-[8vw]">
          <div data-gbar className="h-full origin-left bg-gold-light" />
        </div>
      </div>
    </section>
  )
}

/* ---------------- Booking ---------------- */
export function Booking() {
  const [state, setState] = useState('idle')
  const submit = (e) => {
    e.preventDefault()
    if (state !== 'idle') return
    setState('sending')
    // No backend yet: simulate the request so the flow can be reviewed.
    setTimeout(() => setState('sent'), 1600)
  }
  const field = (id, label, props = {}) => (
    <div className="field">
      <input id={id} name={id} placeholder=" " {...props} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
  return (
    <section id="book" className="relative z-10 overflow-hidden bg-night px-5 py-24 md:py-36" aria-labelledby="book-title">
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(ellipse at 15% 20%, rgba(142,107,54,.28), transparent 55%)' }} />
      <div className="relative mx-auto grid max-w-[1300px] gap-16 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div id="book-title">
            <Heading align="left" kicker="Reserve your date" title="Plan your arrival" sub="Tell us the day; we will hold the car." />
          </div>
          <form onSubmit={submit} className="mt-12 grid gap-x-8 gap-y-7 sm:grid-cols-2" data-reveal>
            {field('name', 'Your name', { required: true, autoComplete: 'name' })}
            {field('phone', 'Phone / WhatsApp', { required: true, type: 'tel', autoComplete: 'tel' })}
            {field('date', 'Event date', { required: true, type: 'date' })}
            {field('venue', 'Venue / city')}
            <div className="field">
              <select id="car" name="car" defaultValue="">
                <option value="" disabled>
                  Choose a car
                </option>
                {CARS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.make} {c.model}
                  </option>
                ))}
                <option value="unsure">Not sure yet, suggest one</option>
              </select>
              <label htmlFor="car">Car</label>
            </div>
            <div className="field">
              <select id="occasion" name="occasion" defaultValue="Wedding">
                <option>Wedding</option>
                <option>Pre-wedding shoot</option>
                <option>Film or ad shoot</option>
                <option>Photo shoot</option>
              </select>
              <label htmlFor="occasion">Occasion</label>
            </div>
            <div className="field sm:col-span-2">
              <textarea id="msg" name="msg" rows="3" placeholder=" " />
              <label htmlFor="msg">Timings, route or anything else</label>
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <button type="submit" className="btn-gold min-w-[15rem]" disabled={state !== 'idle'}>
                {state === 'idle' && (
                  <>
                    Send enquiry <ArrowRight size={16} />
                  </>
                )}
                {state === 'sending' && (
                  <>
                    Sending <LoaderCircle size={16} className="animate-spin" />
                  </>
                )}
                {state === 'sent' && (
                  <>
                    Enquiry received <Check size={16} />
                  </>
                )}
              </button>
              <p className="text-sm text-ivory/55" aria-live="polite">
                {state === 'sent' ? 'Thank you. We will call you back to confirm availability.' : 'We reply with availability and a quote.'}
              </p>
            </div>
          </form>
        </div>

        <aside data-reveal className="relative border border-gold/35 p-8 md:p-12">
          <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-gold-light" />
          <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-gold-light" />
          <p className="kicker">Speak to the garage</p>
          <p className="display mt-4 text-4xl uppercase text-ivory">Direct line</p>
          <ul className="mt-8 space-y-6 text-ivory/80">
            <li className="flex items-start gap-4">
              <Phone size={18} className="mt-1 text-gold-light" />
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="text-lg hover:text-gold-pale">
                {SITE.phone}
              </a>
            </li>
            <li className="flex items-start gap-4">
              <MessageCircle size={18} className="mt-1 text-gold-light" />
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="text-lg hover:text-gold-pale">
                Message on WhatsApp
              </a>
            </li>
            <li className="flex items-start gap-4">
              <Mail size={18} className="mt-1 text-gold-light" />
              <a href={`mailto:${SITE.email}`} className="text-lg hover:text-gold-pale">
                {SITE.email}
              </a>
            </li>
            <li className="flex items-start gap-4">
              <MapPin size={18} className="mt-1 text-gold-light" />
              <span className="text-lg">{SITE.city}</span>
            </li>
            <li className="flex items-start gap-4">
              <Clock size={18} className="mt-1 text-gold-light" />
              <span className="text-lg">{SITE.hours}</span>
            </li>
          </ul>
          <div className="rule my-10" />
          <p className="font-serif text-xl italic text-gold-pale">Wedding season fills early. Hold your date as soon as it is fixed.</p>
        </aside>
      </div>
    </section>
  )
}

/* ---------------- Footer ---------------- */
export function Footer() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const s = new SplitText('[data-foot-big]', { type: 'chars' })
      gsap.fromTo(s.chars, { yPercent: 100 }, { yPercent: 0, stagger: 0.04, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 85%' } })
    }, root)
    return () => ctx.revert()
  }, [])
  const year = new Date().getFullYear()
  return (
    <footer ref={root} className="relative z-10 overflow-hidden border-t border-gold/25 bg-coal px-5 pb-10 pt-20">
      <div className="mx-auto max-w-[1300px]">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-6 max-w-sm text-ivory/60">Vintage cars for weddings, pre-wedding shoots and film productions.</p>
            <p className="mt-6 inline-flex items-center gap-3 text-sm text-ivory/70">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-light opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-light" />
              </span>
              Now taking bookings
            </p>
          </div>
          <div>
            <p className="kicker !text-[0.66rem]">The fleet</p>
            <ul className="mt-5 space-y-2 text-ivory/70">
              {CARS.map((c) => (
                <li key={c.id}>
                  <a href="#fleet" className="hover:text-gold-pale">
                    {c.make} {c.model}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker !text-[0.66rem]">Contact</p>
            <ul className="mt-5 space-y-2 text-ivory/70">
              <li>{SITE.phone}</li>
              <li>{SITE.email}</li>
              <li>{SITE.city}</li>
            </ul>
          </div>
        </div>
        <p data-foot-big className="display mt-20 overflow-hidden whitespace-nowrap text-center text-[15.5vw] uppercase leading-[0.85] text-ivory/[0.07]">
          RR Vintage
        </p>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 text-xs tracking-[0.2em] text-ivory/45 md:flex-row">
          <span>© {year} RR Vintage Rental Cars</span>
          <span className="flex gap-6">
            <a href="/privacy" className="hover:text-gold-pale">
              Privacy
            </a>
            <a href="/terms" className="hover:text-gold-pale">
              Terms
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

