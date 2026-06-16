import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from './scrollState'

gsap.registerPlugin(ScrollTrigger)

/**
 * Single source of truth for scroll:
 *  - Lenis smooth-scroll driven off the GSAP ticker (one rAF clock).
 *  - A master ScrollTrigger writes whole-page progress into scrollState.
 *  - Pointer position is tracked into scrollState for canvas parallax.
 * Honors prefers-reduced-motion: no momentum, no master trigger.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollState.reduced = reduce

    // Pointer tracking works regardless of reduced-motion.
    const onMove = (e) => {
      scrollState.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // Master progress trigger (works with native or smooth scroll).
    const master = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollState.progress = self.progress
      },
    })

    let lenis
    let onTick
    if (!reduce) {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
      })

      lenis.on('scroll', (e) => {
        scrollState.velocity = e.velocity || 0
        ScrollTrigger.update()
      })

      onTick = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(onTick)
      gsap.ticker.lagSmoothing(0)
      window.__lenis = lenis
    }

    // Recalculate once webfonts settle (layout shift changes section heights).
    const refresh = () => ScrollTrigger.refresh()
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh)
    }
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('load', refresh)
      master.kill()
      if (onTick) gsap.ticker.remove(onTick)
      if (lenis) {
        lenis.destroy()
        delete window.__lenis
      }
    }
  }, [])
}

/** Smoothly scroll to an anchor via Lenis when available, native otherwise. */
export function scrollToHash(hash) {
  const el = document.querySelector(hash)
  if (!el) return
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
