import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { createStage } from './three/stage.js'
import Loader from './components/Loader.jsx'
import Cursor from './components/Cursor.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import Story from './components/Story.jsx'
import Fleet from './components/Fleet.jsx'
import { Booking, Footer, Gallery, Heritage, Occasions, Process } from './components/Sections.jsx'

gsap.registerPlugin(ScrollTrigger, SplitText)

export default function App() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const lenisRef = useRef(null)
  const hotspotRefs = useRef([])
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)

  /* 3D stage + smooth scrolling */
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const stage = createStage(canvasRef.current)
    stageRef.current = stage
    stage.setHotspotEls(hotspotRefs.current.filter(Boolean))
    stage.setActive(true)
    let alive = true
    Promise.all([stage.load((p) => alive && setProgress(p)), document.fonts.ready]).then(() => alive && setReady(true))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
    lenisRef.current = lenis
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const onClick = (e) => {
      const link = e.target.closest?.('a[href^="#"]')
      if (!link || e.defaultPrevented) return
      e.preventDefault()
      lenis.scrollTo(link.getAttribute('href'), { duration: 1.8 })
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      alive = false
      gsap.ticker.remove(tick)
      lenis.destroy()
      stage.dispose()
    }
  }, [])

  /* which part of the page is showing the stage, plus global reveals */
  useEffect(() => {
    const stage = stageRef.current
    const vis = { hero: true, fleet: false }
    const apply = () => {
      stage.setMode(vis.fleet ? 'fleet' : 'hero')
      stage.setActive(vis.hero || vis.fleet)
    }
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: '#top', start: 'top top', end: 'bottom top', onUpdate: (s) => stage.setHeroProgress(s.progress) })
      ScrollTrigger.create({ trigger: '#top', start: 'top bottom', end: 'bottom top', onToggle: (s) => ((vis.hero = s.isActive), apply()) })
      ScrollTrigger.create({ trigger: '#fleet', start: 'top bottom', end: 'bottom top', onToggle: (s) => ((vis.fleet = s.isActive), apply()) })

      gsap.to('[data-progressbar]', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })

      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('[data-split]').forEach((el) => {
        const s = new SplitText(el, { type: 'words,chars', mask: 'words' })
        gsap.fromTo(s.chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.022, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } })
      })
    })
    return () => ctx.revert()
  }, [])

  const onEntered = useCallback(() => {
    setEntered(true)
    lenisRef.current?.start()
    stageRef.current?.intro()
    ScrollTrigger.refresh()
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
      {!entered && <Loader progress={progress} ready={ready} onDone={onEntered} />}
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <div className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-pale to-gold" data-progressbar />

      {['a', 'b', 'c'].map((k, i) => (
        <div key={k} ref={(el) => (hotspotRefs.current[i] = el)} className="hotspot" aria-hidden="true">
          <span className="hotspot-dot" />
          <span className="hotspot-line" />
          <span className="hotspot-label" data-label />
        </div>
      ))}

      <Nav lenisRef={lenisRef} />
      <main className="relative">
        <Hero entered={entered} />
        <Marquee />
        <Story />
        <Fleet stageRef={stageRef} />
        <Heritage />
        <Occasions />
        <Process />
        <Gallery />
        <Booking />
      </main>
      <Footer />
    </>
  )
}
