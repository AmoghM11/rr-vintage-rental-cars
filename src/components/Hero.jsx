import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ArrowRight } from 'lucide-react'

export default function Hero({ entered }) {
  const root = useRef(null)

  useEffect(() => {
    if (!entered) return
    const ctx = gsap.context(() => {
      const split = new SplitText('[data-hero-title]', { type: 'words,chars', mask: 'words' })
      const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'expo.out' } })
      tl.fromTo('[data-hero-kicker]', { autoAlpha: 0, y: 16, scale: 1.08 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.8 })
        .fromTo(split.chars, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, stagger: 0.035, duration: 1.5 }, '-=1.4')
        .fromTo('[data-hero-sub]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2 }, '-=1.0')
        .fromTo('[data-hero-cta]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.1 }, '-=0.9')
        .fromTo('[data-hero-frame]', { scaleX: 0 }, { scaleX: 1, duration: 1.6, stagger: 0.1, ease: 'expo.inOut' }, 0.2)
        .fromTo('[data-hero-side]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, stagger: 0.15 }, '-=1')

      // drift the copy away as the hero scrolls out
      gsap.to('[data-hero-copy]', {
        yPercent: -35,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom 20%', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [entered])

  return (
    <section id="top" ref={root} className="relative z-10 h-[100svh] min-h-[640px] overflow-hidden" aria-label="Introduction">
      {/* vignette so copy reads over the 3D stage */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_30%,rgba(7,6,5,.75)_80%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-night via-night/75 to-transparent" />

      {/* museum-plaque frame lines */}
      <div className="pointer-events-none absolute inset-x-5 top-24 md:inset-x-10">
        <div data-hero-frame className="rule origin-center" style={{ transform: 'scaleX(0)' }} />
      </div>
      <div className="pointer-events-none absolute inset-x-5 bottom-8 md:inset-x-10">
        <div data-hero-frame className="rule origin-center" style={{ transform: 'scaleX(0)' }} />
      </div>

      <div data-hero-side className="invisible absolute bottom-16 left-5 hidden md:left-10 md:block">
        <p className="kicker !text-[0.62rem] !tracking-[0.4em]">Fleet of four</p>
        <p className="mt-2 font-serif text-lg italic text-ivory/70">1907 · 1950 · 1955 · Signature</p>
      </div>
      <div data-hero-side className="invisible absolute bottom-16 right-5 hidden flex-col items-center gap-3 md:right-10 md:flex">
        <span className="text-[0.62rem] uppercase tracking-[0.4em] text-ivory/60 [writing-mode:vertical-rl]">Scroll</span>
        <span className="relative h-16 w-px overflow-hidden bg-ivory/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-gold-light" />
        </span>
      </div>

      <div data-hero-copy className="absolute inset-x-0 bottom-[9vh] flex flex-col items-center px-5 text-center">
        <p data-hero-kicker className="kicker invisible">Weddings · Shoots · Cinema</p>
        <h1 data-hero-title className="display mt-4 text-[clamp(2.7rem,6.6vw,6.4rem)] uppercase text-ivory">
          Arrive <span className="text-gold-light">like royalty</span>
        </h1>
        <p data-hero-sub className="invisible mt-5 max-w-xl text-lg text-ivory/75 md:text-xl">
          Vintage classics for weddings and shoots, from a Rolls-Royce Silver Ghost to our signature Marry Vintage roadster.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a data-hero-cta href="#fleet" className="btn-gold invisible">
            Enter the showroom <ArrowRight size={16} />
          </a>
          <a data-hero-cta href="#book" className="btn-ghost invisible">
            Check your date
          </a>
        </div>
      </div>
    </section>
  )
}
