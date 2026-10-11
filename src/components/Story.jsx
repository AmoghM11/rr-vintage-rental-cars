import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

/* An engraving-style vintage tourer that draws itself on the parchment. */
function CarEngraving() {
  return (
    <svg viewBox="0 0 640 230" className="mx-auto w-full max-w-xl" fill="none" stroke="#5a3b17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path data-draw d="M18 206 H622" strokeWidth="1" opacity=".6" />
      {/* wheels */}
      {[150, 478].map((cx) => (
        <g key={cx}>
          <circle data-draw cx={cx} cy="166" r="38" />
          <circle data-draw cx={cx} cy="166" r="28" strokeWidth="1" />
          <circle data-draw cx={cx} cy="166" r="6" />
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2
            return <path key={k} data-draw d={`M${cx + Math.cos(a) * 6} ${166 + Math.sin(a) * 6} L${cx + Math.cos(a + 0.2) * 28} ${166 + Math.sin(a + 0.2) * 28}`} strokeWidth=".7" />
          })}
        </g>
      ))}
      {/* wings and running board */}
      <path data-draw d="M100 168 C102 118 200 116 204 166 L206 176 L420 176 C424 132 446 120 478 120 C520 120 540 142 548 166 C552 172 560 176 572 178" />
      {/* body */}
      <path data-draw d="M64 158 C62 122 88 106 132 104 L236 104 C252 104 254 70 268 68 C284 66 286 96 302 98 L350 98 L364 52" />
      <path data-draw d="M356 98 L512 92 C530 92 540 96 542 110 L542 154" />
      <path data-draw d="M362 104 L362 146 M300 104 L300 146 M240 110 L240 146" strokeWidth="1" />
      {/* radiator, lamp, screen, wheel */}
      <path data-draw d="M530 92 L546 92 L546 154 L530 154 Z M534 98 L534 150 M538 98 L538 150 M542 98 L542 150" strokeWidth="1" />
      <circle data-draw cx="566" cy="114" r="10" />
      <path data-draw d="M556 114 L546 120 M576 150 L598 150" />
      <ellipse data-draw cx="330" cy="80" rx="5" ry="16" transform="rotate(-24 330 80)" />
      <path data-draw d="M538 86 C540 76 548 74 550 86" strokeWidth="1" />
    </svg>
  )
}

export default function Story() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const paper = root.current.querySelector('[data-paper]')
      // unroll the scroll
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'top 5%', scrub: 0.6 } })
        .fromTo(paper, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', ease: 'none' })
        .fromTo('[data-roller-bottom]', { y: () => -paper.offsetHeight }, { y: 0, ease: 'none' }, 0)

      // engraving draws on
      const paths = root.current.querySelectorAll('[data-draw]')
      paths.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 400
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
      })
      gsap.to(paths, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: 0.02,
        scrollTrigger: { trigger: '[data-engraving]', start: 'top 85%', end: 'bottom 45%', scrub: 0.8 },
      })

      // heading + reading reveal
      const h = new SplitText('[data-story-title]', { type: 'words,chars' })
      gsap.fromTo(h.chars, { autoAlpha: 0, filter: 'blur(8px)' }, {
        autoAlpha: 1,
        filter: 'blur(0px)',
        stagger: 0.05,
        scrollTrigger: { trigger: '[data-story-title]', start: 'top 80%', end: 'top 45%', scrub: 0.6 },
      })
      const words = new SplitText('[data-read]', { type: 'words' })
      gsap.fromTo(words.words, { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: { trigger: '[data-read]', start: 'top 80%', end: 'bottom 55%', scrub: true },
      })
      gsap.fromTo('[data-ornament]', { scaleX: 0 }, { scaleX: 1, ease: 'expo.out', duration: 1.6, scrollTrigger: { trigger: '[data-ornament]', start: 'top 85%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="story" ref={root} className="relative z-10 overflow-hidden bg-night px-4 pb-28 pt-24 md:pb-36" aria-labelledby="story-title">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(142,107,54,.35), transparent 60%)' }} />
      <div className="relative mx-auto max-w-4xl">
        <div className="roller relative z-10 mx-2" />
        <div data-paper className="paper relative -mt-6 px-6 pb-16 pt-16 text-center md:px-20" style={{ clipPath: 'inset(0 0 100% 0)' }}>
          <p className="font-sans text-[0.78rem] font-semibold uppercase tracking-[0.5em] text-[#7a5523]">RR Vintage</p>
          <h2 id="story-title" data-story-title className="display mt-5 text-[clamp(2.8rem,7vw,5.6rem)] uppercase text-[#2b1e10]">
            A legacy on wheels
          </h2>
          <p className="mt-4 font-serif text-xl italic text-[#5a3b17] md:text-2xl">
            For weddings, pre-wedding shoots and the silver screen.
          </p>
          <div data-engraving className="mt-10">
            <CarEngraving />
          </div>
          <div data-ornament className="mx-auto mt-8 flex max-w-md items-center gap-4 text-[#7a5523]">
            <span className="h-px flex-1 bg-current opacity-60" />
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor" />
            </svg>
            <span className="h-px flex-1 bg-current opacity-60" />
          </div>
          <p data-read className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#3a2814] md:text-[1.3rem]">
            RR Vintage Rental Cars keeps four classics from the golden age of motoring polished, running and ready for the days you will
            remember longest. From an ivory Rolls-Royce Silver Ghost to the burgundy Marry Vintage roadster, every car is kept for the road,
            not a museum plinth, and arrives ready for the entrance, the procession and the camera.
          </p>
          <p className="mt-10 font-serif text-2xl italic text-[#7a5523]">— The RR Vintage garage</p>
        </div>
        <div data-roller-bottom className="roller relative z-10 mx-2 -mt-6" />
      </div>
    </section>
  )
}
