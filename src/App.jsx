import { useEffect, useRef } from 'react'
import Experience from './three/Experience'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import { scrollState } from './lib/scrollState'

function ScrollHint() {
  const ref = useRef(null)
  useEffect(() => {
    let raf
    const loop = () => {
      if (ref.current) {
        const hidden = (scrollState.progress || 0) > 0.012
        ref.current.style.opacity = hidden ? '0' : '0.75'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div ref={ref} className="scrollhint mono" aria-hidden="true">
      <span>scroller pour voyager</span>
      <span className="scrollhint__bar" />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    scrollState.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const onMove = (e) => {
      scrollState.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <Experience />
      <div className="grain" />
      <Cursor />
      <Nav />
      <ScrollHint />
    </>
  )
}
