import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { content } from '../content'
import { scrollToHash } from '../lib/useSmoothScroll'

export default function Nav() {
  const bar = useRef(null)

  useEffect(() => {
    if (!bar.current) return
    gsap.set(bar.current, { scaleX: 0, transformOrigin: 'left center' })
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        gsap.set(bar.current, { scaleX: self.progress })
      },
    })
    return () => st.kill()
  }, [])

  const onNav = (e, href) => {
    e.preventDefault()
    scrollToHash(href)
  }

  return (
    <header className="nav">
      <div className="nav__inner wrap">
        <a href="#top" className="nav__brand" onClick={(e) => onNav(e, '#top')} data-cursor>
          <span className="nav__mono">A</span>
          <span className="nav__x">×</span>
          <span className="nav__mono">S</span>
        </a>

        <nav className="nav__links">
          {content.nav.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => onNav(e, item.href)}>
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="nav__cta mono" onClick={(e) => onNav(e, '#contact')} data-cursor>
          {content.cta.button}
        </a>
      </div>
      <div className="nav__progress">
        <span ref={bar} />
      </div>
    </header>
  )
}
