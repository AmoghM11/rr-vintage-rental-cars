import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ArrowRight } from 'lucide-react'
import { CARS } from '../data.js'

const fmt = (n) => (n >= 1000 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n)))

function StageLamp({ side }) {
  return (
    <svg
      data-lamp
      viewBox="0 0 120 140"
      className={`pointer-events-none absolute top-20 hidden w-24 text-ivory md:block ${side === 'left' ? 'left-[6vw]' : 'right-[6vw] -scale-x-100'}`}
      style={{ transformOrigin: '60px 0px' }}
      aria-hidden="true"
    >
      <path d="M60 0 V34" stroke="#3a3530" strokeWidth="4" />
      <path d="M40 34 H80" stroke="#3a3530" strokeWidth="5" strokeLinecap="round" />
      <g transform="rotate(28 60 70)">
        <rect x="38" y="40" width="44" height="58" rx="8" fill="#141210" stroke="#2c2824" />
        <ellipse cx="60" cy="100" rx="24" ry="7" fill="#fff4dc" />
        <ellipse cx="60" cy="100" rx="40" ry="14" fill="#ffe2b0" opacity=".18" />
      </g>
    </svg>
  )
}

function Panel({ car, i }) {
  const side = i % 2 === 0 ? 'md:left-[6vw]' : 'md:right-[6vw]'
  return (
    <article data-panel={i} className={`absolute inset-x-0 bottom-0 px-5 pb-[5.5rem] md:inset-x-auto md:bottom-auto md:top-1/2 md:w-[min(31rem,36vw)] md:-translate-y-1/2 md:px-0 md:pb-0 ${side}`}>
      <div className="relative">
        <span data-a className="display pointer-events-none absolute -top-16 right-0 select-none text-[9rem] leading-none text-gold/15 md:-left-6 md:-top-28 md:right-auto md:text-[13rem]">
          {car.num}
        </span>
        <p data-a className="kicker relative">
          {car.num} / 04 · {car.era}
        </p>
        <h3 data-title className="display relative mt-3 overflow-hidden pb-1 text-[clamp(2.6rem,5.2vw,4.6rem)] uppercase leading-[0.95] text-ivory">
          {car.make}
        </h3>
        <p data-a className="relative mt-1 font-serif text-2xl italic text-gold-pale md:text-[1.7rem]">{car.model}</p>
        <p data-a className="relative mt-4 hidden text-[1.02rem] leading-relaxed text-ivory/75 md:block">
          {car.story}
        </p>
        <dl className="relative mt-5 grid grid-cols-2 gap-x-6 border-t border-gold/30">
          {car.specs.map((s, k) => (
            // short phone screens keep one row of specs so the text clears the turntable
            <div key={s.label} data-spec className={`border-b border-gold/20 py-2.5 md:py-3 ${k > 1 ? 'max-md:[@media(max-height:760px)]:hidden' : ''}`}>
              <dt className="text-[0.7rem] uppercase tracking-[0.28em] text-ivory/60 md:text-[0.66rem] md:tracking-[0.32em]">{s.label}</dt>
              <dd className="mt-0.5 text-[1.02rem] font-medium text-ivory md:text-lg">
                {s.prefix}
                {s.num != null ? <span data-count={s.num}>0</span> : s.text}
                {s.suffix}
              </dd>
            </div>
          ))}
        </dl>
        <div data-a className="relative mt-4 hidden flex-wrap gap-2 md:flex">
          {car.perfect.map((p) => (
            <span key={p} className="border border-gold/40 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-gold-pale">
              {p}
            </span>
          ))}
        </div>
        <a data-a href="#book" className="btn-gold relative mt-5 !py-3.5 md:mt-6">
          Reserve the {car.make} <ArrowRight size={15} />
        </a>
      </div>
    </article>
  )
}

export default function Fleet({ stageRef }) {
  const root = useRef(null)
  const pin = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ---- intro: THE FLEET spreads open, stage lamps swing in ---- */
      const title = new SplitText('[data-fleet-title]', { type: 'words,chars' })
      gsap
        .timeline({ scrollTrigger: { trigger: '[data-fleet-intro]', start: 'top 85%', end: 'bottom 30%', scrub: 0.8 } })
        .fromTo(title.chars, { autoAlpha: 0, yPercent: 60, rotateX: -80 }, { autoAlpha: 1, yPercent: 0, rotateX: 0, stagger: 0.06 })
        .fromTo('[data-fleet-title]', { scale: 0.86 }, { scale: 1, ease: 'none' }, 0)
        .fromTo('[data-fleet-intro] [data-in]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.15 }, 0.3)
        .fromTo('[data-lamp]', { rotate: -55, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, ease: 'back.out(1.6)' }, 0.1)

      /* ---- the pinned showroom ---- */
      const panels = gsap.utils.toArray('[data-panel]')
      const nodes = gsap.utils.toArray('[data-node]')
      const subs = gsap.utils.toArray('[data-sub]')
      const counter = root.current.querySelector('[data-counter]')
      let current = -1

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: pin.current,
          start: 'top top',
          end: () => '+=' + window.innerHeight * 7.5,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const T = tl.time()
          stageRef.current?.setFleetTime(T)
          const idx = Math.min(3, Math.floor(T))
          if (idx !== current) {
            current = idx
            nodes.forEach((n, k) => n.toggleAttribute('data-on', k <= idx))
            if (counter) counter.textContent = `0${idx + 1}`
          }
        },
      })

      panels.forEach((panel, i) => {
        const b = i
        const last = i === panels.length - 1
        const t = panel.querySelector('[data-title]')
        const chars = new SplitText(t, { type: 'words,chars' }).chars
        const a = panel.querySelectorAll('[data-a]')
        const specs = panel.querySelectorAll('[data-spec]')

        tl.fromTo(a[0], { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.2 }, b + 0.1)
          .fromTo(a[1], { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.08 }, b + 0.14)
          .fromTo(chars, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.012, duration: 0.1 }, b + 0.16)
          .fromTo([a[2], a[3]], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.03, duration: 0.1 }, b + 0.22)
          .fromTo(specs, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.025, duration: 0.08 }, b + 0.3)
          .fromTo([a[4], a[5]], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.03, duration: 0.08 }, b + 0.42)
          .fromTo(subs[i], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.12 }, b + 0.5)

        panel.querySelectorAll('[data-count]').forEach((el) => {
          const o = { v: 0 }
          const to = +el.dataset.count
          tl.fromTo(o, { v: 0 }, { v: to, duration: 0.22, ease: 'power1.out', onUpdate: () => (el.textContent = fmt(o.v)) }, b + 0.3)
        })

        if (!last) {
          tl.to([...a, ...specs, ...chars], { autoAlpha: 0, y: -20, stagger: 0.004, duration: 0.07, ease: 'power2.in' }, b + 0.84)
          tl.to(subs[i], { autoAlpha: 0, duration: 0.06 }, b + 0.84)
        }
      })
      // keep text legible where the turntable runs underneath it
      panels.forEach((_, i) => {
        const scrim = i % 2 === 0 ? '[data-scrim="left"]' : '[data-scrim="right"]'
        tl.to(scrim, { opacity: 1, duration: 0.12 }, i + 0.08)
        if (i < panels.length - 1) tl.to(scrim, { opacity: 0, duration: 0.1 }, i + 0.88)
      })
      tl.fromTo('[data-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 4 }, 0)
      tl.set({}, {}, 4)
    }, root)
    return () => ctx.revert()
  }, [stageRef])

  return (
    <section id="fleet" ref={root} className="relative z-10" aria-labelledby="fleet-title">
      {/* intro over the darkened stage */}
      <div data-fleet-intro className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center [perspective:600px]">
        <StageLamp side="left" />
        <StageLamp side="right" />
        <p data-in className="kicker">Spotlight on wheels</p>
        <h2 id="fleet-title" data-fleet-title className="display mt-6 text-[clamp(3.4rem,12vw,10rem)] uppercase tracking-[0.18em] text-ivory will-change-transform">
          The Fleet
        </h2>
        <p data-in className="mt-4 font-serif text-2xl italic text-gold-pale md:text-3xl">
          Four classics. One spotlight.
        </p>
        <p data-in className="mt-4 max-w-md text-ivory/65">
          Keep scrolling to bring each car onto the turntable. Every one is kept road-ready for weddings and shoots.
        </p>
      </div>

      {/* pinned showroom */}
      {/* The pin covers the large viewport (mobile toolbars collapsed) so no bare strip shows at the
          bottom; the content inside is laid out on the small viewport so it is never under a toolbar. */}
      <div ref={pin} className="relative h-[100lvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-night via-night/90 to-transparent md:hidden" />
        <div data-scrim="left" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55vw] bg-gradient-to-r from-night via-night/70 to-transparent opacity-0 md:block" />
        <div data-scrim="right" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55vw] bg-gradient-to-l from-night via-night/70 to-transparent opacity-0 md:block" />
        <div className="absolute inset-x-0 top-0 h-[100svh]">
          <div className="absolute left-1/2 top-24 hidden -translate-x-1/2 text-center md:block">
            <p className="kicker !text-[0.66rem]">Spotlight on wheels</p>
            <p className="display mt-1 text-2xl text-ivory/80">
              <span data-counter>01</span> <span className="text-ivory/30">/ 04</span>
            </p>
          </div>

          {CARS.map((c, i) => (
            <Panel key={c.id} car={c} i={i} />
          ))}

          {/* cinematic subtitle per car */}
          <div className="fleet-sub pointer-events-none absolute inset-x-0 bottom-28 hidden text-center md:block">
            {CARS.map((c, i) => (
              <p
                key={c.id}
                data-sub
                className={`absolute inset-x-0 mx-auto max-w-xl font-serif text-xl italic text-ivory/70 ${i % 2 === 0 ? 'md:translate-x-[12vw]' : 'md:-translate-x-[12vw]'}`}
              >
                {c.quote}
              </p>
            ))}
          </div>

          {/* year timeline, Payana style */}
          <div className="absolute inset-x-5 bottom-8 mx-auto max-w-3xl md:inset-x-10">
            <div className="relative h-px bg-ivory/15">
              <div data-progress className="absolute inset-0 origin-left bg-gold-light" />
            </div>
            <div className="mt-[-6px] grid grid-cols-4">
              {CARS.map((c) => (
                <div key={c.id} data-node className="group flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full border border-gold-light bg-night transition-all duration-500 group-data-[on]:scale-125 group-data-[on]:bg-gold-light" />
                  <span className="mt-2 text-[0.66rem] uppercase tracking-[0.3em] text-ivory/60 transition-colors group-data-[on]:text-gold-pale">
                    {c.node}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
