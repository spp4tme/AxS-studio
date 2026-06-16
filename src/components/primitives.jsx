import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from '../lib/scrollState'

gsap.registerPlugin(ScrollTrigger)

/** Scans [data-reveal] inside a scope and fades them up on scroll. Call once. */
export function useReveal(scopeRef) {
  useLayoutEffect(() => {
    if (scrollState.reduced || !scopeRef.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        const delay = parseFloat(el.dataset.revealDelay || '0')
        gsap.from(el, {
          yPercent: 14,
          autoAlpha: 0,
          duration: 0.95,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
    }, scopeRef)
    return () => ctx.revert()
  }, [scopeRef])
}

/** Headline with a per-word masked "wipe up" reveal. */
export function Headline({ text, className = '', as: Tag = 'h2', start = 'top 85%' }) {
  const ref = useRef(null)
  const words = String(text).split(' ')

  useLayoutEffect(() => {
    if (scrollState.reduced || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.from(ref.current.querySelectorAll('.w > span'), {
        yPercent: 120,
        duration: 1.05,
        ease: 'power4.out',
        stagger: 0.055,
        scrollTrigger: { trigger: ref.current, start },
      })
    }, ref)
    return () => ctx.revert()
  }, [text, start])

  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="w">
            <span>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}

const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>_#*+=·'

/** Monospace text that boots up with a scramble-to-resolve effect when in view. */
export function ScrambleText({ text, className = '', as: Tag = 'span', threshold = 0.55 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(scrollState.reduced ? text : text.replace(/[^\s]/g, '·'))

  useEffect(() => {
    if (scrollState.reduced) {
      setDisplay(text)
      return
    }
    let frame
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true
          run()
          io.disconnect()
        }
      },
      { threshold },
    )
    if (ref.current) io.observe(ref.current)

    function run() {
      const dur = 620
      const t0 = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur)
        const reveal = Math.floor(t * text.length)
        let s = ''
        for (let i = 0; i < text.length; i++) {
          if (i < reveal || text[i] === ' ') s += text[i]
          else s += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]
        }
        setDisplay(s)
        if (t < 1) frame = requestAnimationFrame(tick)
        else setDisplay(text)
      }
      frame = requestAnimationFrame(tick)
    }

    return () => {
      io.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [text, threshold])

  return (
    <Tag ref={ref} className={className}>
      {display}
    </Tag>
  )
}

/** Magnetic hover: child drifts toward the pointer, springs back on leave. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (scrollState.reduced) return
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const mx = e.clientX - (r.left + r.width / 2)
      const my = e.clientY - (r.top + r.height / 2)
      gsap.to(el, { x: mx * strength, y: my * strength, duration: 0.5, ease: 'power3.out' })
    }
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])
  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </span>
  )
}

/** Small blinking "terminal" tag. */
export function MonoTag({ children, className = '' }) {
  return <span className={`mono mono-tag ${className}`}>{children}</span>
}
