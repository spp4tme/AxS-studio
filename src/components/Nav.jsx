import { useEffect, useRef } from 'react'
import { content } from '../content'
import { STATIONS } from '../lib/journey'
import { scrollState } from '../lib/scrollState'

const HREF_TO_KEY = {
  '#services': 'services',
  '#methode': 'process',
  '#cas': 'cases',
  '#duo': 'duo',
  '#contact': 'cta',
  '#top': 'hero',
}

function goTo(key) {
  const st = STATIONS.find((s) => s.key === key)
  if (st && window.__journey) window.__journey.scrollTo(st.at)
}

export default function Nav() {
  const bar = useRef(null)
  useEffect(() => {
    let raf
    const loop = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${scrollState.progress || 0})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onNav = (e, key) => {
    e.preventDefault()
    goTo(key)
  }

  return (
    <header className="nav">
      <div className="nav__inner wrap">
        <a href="#top" className="nav__brand" onClick={(e) => onNav(e, 'hero')} data-cursor>
          <span>A</span>
          <span className="nav__x">×</span>
          <span>S</span>
        </a>
        <nav className="nav__links">
          {content.nav.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => onNav(e, HREF_TO_KEY[item.href])}>
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="nav__cta mono" onClick={(e) => onNav(e, 'cta')} data-cursor>
          {content.cta.button}
        </a>
      </div>
      <div className="nav__progress">
        <span ref={bar} />
      </div>
    </header>
  )
}
