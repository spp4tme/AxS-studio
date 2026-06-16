import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { NodeNetwork } from './NodeNetwork'
import { CAMERA_KEYS } from '../lib/layouts'
import { scrollState } from '../lib/scrollState'

function detectTier() {
  if (typeof window === 'undefined') return { ok: true, low: false }
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return { ok: false, low: true }
  } catch (e) {
    return { ok: false, low: true }
  }
  const low =
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4)
  return { ok: true, low }
}

function Rig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const tmpPos = useRef(new THREE.Vector3())
  const tmpLook = useRef(new THREE.Vector3())

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const p = THREE.MathUtils.clamp(scrollState.progress, 0, 1)
    const n = CAMERA_KEYS.length
    const seg = p * (n - 1)
    let i0 = Math.floor(seg)
    if (i0 > n - 2) i0 = n - 2
    let f = THREE.MathUtils.clamp(seg - i0, 0, 1)
    f = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2 // easeInOut
    const a = CAMERA_KEYS[i0]
    const b = CAMERA_KEYS[i0 + 1]

    tmpPos.current.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * f,
      a.pos[1] + (b.pos[1] - a.pos[1]) * f,
      a.pos[2] + (b.pos[2] - a.pos[2]) * f,
    )
    // pointer parallax
    tmpPos.current.x += scrollState.mouseX * 0.7
    tmpPos.current.y += -scrollState.mouseY * 0.5

    tmpLook.current.set(
      a.look[0] + (b.look[0] - a.look[0]) * f,
      a.look[1] + (b.look[1] - a.look[1]) * f,
      a.look[2] + (b.look[2] - a.look[2]) * f,
    )

    const k = 3.2
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tmpPos.current.x, k, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, tmpPos.current.y, k, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tmpPos.current.z, k, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, tmpLook.current.x, k, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, tmpLook.current.y, k, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, tmpLook.current.z, k, dt)
    camera.lookAt(look.current)
  })
  return null
}

export default function Scene() {
  const tier = useMemo(detectTier, [])

  if (!tier.ok) {
    // No WebGL — leave the dark backdrop, content stays fully readable.
    return <div className="scene-fallback" aria-hidden="true" />
  }

  const count = tier.low ? 70 : 140
  const packetCount = tier.low ? 14 : 26
  const dpr = tier.low ? [1, 1.3] : [1, 1.6]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        camera={{ position: CAMERA_KEYS[0].pos, fov: 46, near: 0.1, far: 100 }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
        }}
      >
        <color attach="background" args={['#07080a']} />
        <NodeNetwork count={count} packetCount={packetCount} />
        <Rig />
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={tier.low ? 0.85 : 1.05}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.32}
            radius={0.86}
          />
          <Vignette eskil={false} offset={0.22} darkness={0.92} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
