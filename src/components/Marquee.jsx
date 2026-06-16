import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { content } from '../content'
import { scrollState } from '../lib/scrollState'

/** Infinite neon marquee of the tooling stack. Speed nudged by scroll velocity. */
export default function Marquee() {
  const track = useRef(null)

  useEffect(() => {
    if (scrollState.reduced || !track.current) return
    const tween = gsap.to(track.current, {
      xPercent: -50,
      repeat: -1,
      ease: 'none',
      duration: 28,
    })
    let raf
    const loop = () => {
      const v = Math.min(Math.abs(scrollState.velocity) * 0.05, 4)
      tween.timeScale(1 + v)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      tween.kill()
      cancelAnimationFrame(raf)
    }
  }, [])

  const items = [...content.stack, ...content.stack]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track" ref={track}>
        {items.map((s, i) => (
          <span className="marquee__item" key={i}>
            <span className="marquee__dot" />
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
