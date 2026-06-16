import { useRef } from 'react'
import { useSmoothScroll } from './lib/useSmoothScroll'
import { useReveal } from './components/primitives'
import Scene from './three/Scene'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Process from './components/Process'
import Cases from './components/Cases'
import Duo from './components/Duo'
import CTA from './components/CTA'
import Footer from './components/Footer'

export default function App() {
  const main = useRef(null)
  useSmoothScroll()
  useReveal(main)

  return (
    <>
      <Scene />
      <div className="grain" />
      <Cursor />
      <Nav />
      <main ref={main} className="content">
        <Hero />
        <Marquee />
        <Services />
        <Process />
        <Cases />
        <Duo />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
