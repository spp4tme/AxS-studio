import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, useScroll, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { WorkflowField } from './WorkflowField'
import { camCurve, lookCurve, STATIONS, SCROLL_PAGES } from '../lib/journey'
import { scrollState } from '../lib/scrollState'
import { PANELS } from '../components/Panels'

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

function detectTier() {
  if (typeof window === 'undefined') return { ok: true, low: false }
  try {
    const c = document.createElement('canvas')
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return { ok: false, low: true }
  } catch (e) {
    return { ok: false, low: true }
  }
  // Only degrade on genuinely weak / mobile devices — a 4-core laptop is common.
  const low =
    window.innerWidth < 700 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.deviceMemory && navigator.deviceMemory < 2)
  return { ok: true, low }
}

function Rig() {
  const scroll = useScroll()
  const { camera } = useThree()
  const tRef = useRef(0)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])

  // Expose a scroll-to-station helper for the (out-of-canvas) nav.
  useEffect(() => {
    window.__scrollEl = scroll.el
    window.__journey = {
      scrollTo(at) {
        const el = scroll.el
        if (!el) return
        el.scrollTo({ top: at * (el.scrollHeight - el.clientHeight), behavior: 'smooth' })
      },
    }
    return () => { delete window.__journey; delete window.__scrollEl }
  }, [scroll])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    // Single smoothing source: ScrollControls already damps `offset`. A light extra
    // damp keeps it buttery without the laggy "hard to scroll" double-damping.
    tRef.current = THREE.MathUtils.damp(tRef.current, scroll.offset, 9, dt)
    const t = clamp01(tRef.current)
    scrollState.progress = t

    // smooth pointer parallax
    scrollState.mouseX = THREE.MathUtils.damp(scrollState.mouseX, scrollState.targetMouseX, 4, dt)
    scrollState.mouseY = THREE.MathUtils.damp(scrollState.mouseY, scrollState.targetMouseY, 4, dt)

    camCurve.getPoint(t, pos)
    lookCurve.getPoint(t, look)
    pos.x += scrollState.mouseX * 1.1
    pos.y += -scrollState.mouseY * 0.8

    camera.position.copy(pos)
    camera.lookAt(look)
  })
  return null
}

function Station({ data, portal }) {
  const scroll = useScroll()
  const ref = useRef(null)
  const wide = data.key !== 'hero' && data.key !== 'cta'

  useFrame(() => {
    if (!ref.current) return
    const d = Math.abs(scroll.offset - data.at)
    const a = clamp01(1 - d / 0.08)
    const op = smoothstep(a)
    ref.current.style.opacity = op
    ref.current.style.setProperty('--a', op.toFixed(3))
    // NB: the panel itself stays pointer-events:none (CSS) so it never eats the
    // mouse wheel — only interactive children (.btn) opt back in.
  })

  const Panel = PANELS[data.key]
  return (
    <group position={data.pos}>
      <Html
        center
        portal={portal}
        distanceFactor={10}
        zIndexRange={[100, 0]}
        style={{ width: wide ? 860 : 760, willChange: 'opacity, transform' }}
      >
        <div ref={ref} className="p3-wrap">
          <Panel />
        </div>
      </Html>
    </group>
  )
}

export default function Experience() {
  const tier = useMemo(detectTier, [])
  const portal = useRef(null)
  if (!tier.ok) return <div className="scene-fallback" aria-hidden="true" />

  const dpr = tier.low ? [1, 1.3] : [1, 1.75]

  return (
    <div className="experience">
      <div ref={portal} className="html-portal" />
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 1.8, 20], fov: 42, near: 0.1, far: 320 }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <color attach="background" args={['#07080a']} />
        <fogExp2 attach="fog" args={['#07080a', 0.012]} />
        <ScrollControls pages={SCROLL_PAGES} damping={0.12}>
          <WorkflowField showLabels={!tier.low} portal={portal} />
          {STATIONS.map((s) => (
            <Station key={s.key} data={s} portal={portal} />
          ))}
          <Rig />
          <EffectComposer disableNormalPass multisampling={0}>
            <Bloom mipmapBlur intensity={tier.low ? 0.85 : 1.0} luminanceThreshold={0.22} luminanceSmoothing={0.32} radius={0.85} />
            <Vignette eskil={false} offset={0.2} darkness={0.92} />
          </EffectComposer>
        </ScrollControls>
      </Canvas>
    </div>
  )
}
