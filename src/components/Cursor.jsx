import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/** Difference-blend dot + ring cursor. Ring swells over interactive targets. */
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const d = dot.current
    const r = ring.current
    if (!d || !r) return

    const dx = gsap.quickTo(d, 'left', { duration: 0.08, ease: 'power2' })
    const dy = gsap.quickTo(d, 'top', { duration: 0.08, ease: 'power2' })
    const rx = gsap.quickTo(r, 'left', { duration: 0.34, ease: 'power3' })
    const ry = gsap.quickTo(r, 'top', { duration: 0.34, ease: 'power3' })

    const onMove = (e) => {
      dx(e.clientX); dy(e.clientY)
      rx(e.clientX); ry(e.clientY)
    }
    const onOver = (e) => {
      if (e.target.closest('a, button, [data-cursor]')) r.classList.add('is-hover')
    }
    const onOut = (e) => {
      if (e.target.closest('a, button, [data-cursor]')) r.classList.remove('is-hover')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  )
}
