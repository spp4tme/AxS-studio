import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { scrollState } from '../lib/scrollState'
import { buildLayouts, LAYOUT_COUNT } from '../lib/layouts'

const NODE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aGlow;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPixelRatio;
  varying float vGlow;
  varying float vReveal;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float appear = smoothstep(aSeed, aSeed + 0.14, uReveal);
    vReveal = appear;
    vGlow = aGlow;
    float pulse = 0.82 + 0.18 * sin(uTime * 1.6 + aSeed * 31.0);
    float size = aSize * pulse * appear;
    gl_PointSize = size * uPixelRatio * (8.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const NODE_FRAG = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorGlow;
  varying float vGlow;
  varying float vReveal;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorGlow, uColorCore, core * core);
    float intensity = (0.35 + core * 1.25) * (0.6 + vGlow * 1.05);
    float alpha = core * vReveal;
    gl_FragColor = vec4(col * intensity, alpha);
  }
`

const PACKET_VERT = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * (8.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const PACKET_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * (0.6 + core * 2.4), core);
  }
`

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const damp = (cur, tgt, lambda, dt) => THREE.MathUtils.damp(cur, tgt, lambda, dt)

export function NodeNetwork({ count = 140, packetCount = 26 }) {
  const N = count
  const groupRef = useRef()
  const reveal = useRef({ v: 0 })

  const THRESH = 1.95
  const THRESH2 = THRESH * THRESH
  const MAX_PAIRS = Math.min(1500, (N * (N - 1)) / 2)
  const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)

  const layouts = useMemo(() => buildLayouts(N), [N])

  // ---- Node geometry + material -------------------------------------------
  const { nodeGeo, nodeMat, cur, sizes, seeds, glows, appear } = useMemo(() => {
    const cur = new Float32Array(N * 3)
    cur.set(layouts[0])
    const sizes = new Float32Array(N)
    const seeds = new Float32Array(N)
    const glows = new Float32Array(N)
    const appear = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const hub = Math.random() < 0.16
      sizes[i] = hub ? 16 + Math.random() * 12 : 5 + Math.random() * 6
      seeds[i] = Math.random()
      glows[i] = hub ? 0.8 + Math.random() * 0.2 : Math.random() * 0.5
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(cur, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aGlow', new THREE.BufferAttribute(glows, 1))

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uPixelRatio: { value: DPR },
        uColorCore: { value: new THREE.Color(1.7, 2.2, 1.2) },
        uColorGlow: { value: new THREE.Color(0.5, 1.25, 0.08) },
      },
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { nodeGeo: g, nodeMat: m, cur, sizes, seeds, glows, appear }
  }, [N, layouts, DPR])

  // ---- Edge geometry (proximity lines, single LineSegments) ---------------
  const { edgeGeo, edgeMat, edgePos, edgeCol } = useMemo(() => {
    const edgePos = new Float32Array(MAX_PAIRS * 2 * 3)
    const edgeCol = new Float32Array(MAX_PAIRS * 2 * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(edgePos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3).setUsage(THREE.DynamicDrawUsage))
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { edgeGeo: g, edgeMat: m, edgePos, edgeCol }
  }, [MAX_PAIRS])

  // ---- Packets (data flowing along edges) ---------------------------------
  const { packetGeo, packetMat, packetPos, packets } = useMemo(() => {
    const packetPos = new Float32Array(packetCount * 3)
    const packets = []
    for (let i = 0; i < packetCount; i++) {
      packets.push({
        a: (Math.random() * N) | 0,
        b: (Math.random() * N) | 0,
        t: Math.random(),
        speed: 0.25 + Math.random() * 0.5,
      })
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(packetPos, 3).setUsage(THREE.DynamicDrawUsage))
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: DPR },
        uSize: { value: 9 },
        uColor: { value: new THREE.Color(1.6, 2.6, 0.7) },
      },
      vertexShader: PACKET_VERT,
      fragmentShader: PACKET_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { packetGeo: g, packetMat: m, packetPos, packets }
  }, [packetCount, N, DPR])

  // ---- Boot reveal --------------------------------------------------------
  useEffect(() => {
    if (scrollState.reduced) {
      reveal.current.v = 1
      nodeMat.uniforms.uReveal.value = 1
      return
    }
    const tween = gsap.to(reveal.current, { v: 1, duration: 1.6, ease: 'power2.out', delay: 0.15 })
    return () => tween.kill()
  }, [nodeMat])

  // ---- Frame loop ---------------------------------------------------------
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const t = state.clock.elapsedTime
    const reduced = scrollState.reduced

    // smooth pointer
    scrollState.mouseX = damp(scrollState.mouseX, scrollState.targetMouseX, 5, dt)
    scrollState.mouseY = damp(scrollState.mouseY, scrollState.targetMouseY, 5, dt)

    nodeMat.uniforms.uReveal.value = reveal.current.v
    nodeMat.uniforms.uTime.value = t

    // morph node positions between layouts
    const p = THREE.MathUtils.clamp(scrollState.progress, 0, 1)
    const seg = p * (LAYOUT_COUNT - 1)
    let i0 = Math.floor(seg)
    if (i0 > LAYOUT_COUNT - 2) i0 = LAYOUT_COUNT - 2
    const f = easeInOut(THREE.MathUtils.clamp(seg - i0, 0, 1))
    const A = layouts[i0]
    const B = layouts[i0 + 1]
    const breath = reduced ? 0 : 1

    for (let i = 0; i < N; i++) {
      const k = i * 3
      const sd = seeds[i]
      const bx = breath * Math.sin(t * 0.6 + sd * 12.0) * 0.13
      const by = breath * Math.cos(t * 0.5 + sd * 9.0) * 0.13
      const bz = breath * Math.sin(t * 0.4 + sd * 15.0) * 0.13
      cur[k] = A[k] + (B[k] - A[k]) * f + bx
      cur[k + 1] = A[k + 1] + (B[k + 1] - A[k + 1]) * f + by
      cur[k + 2] = A[k + 2] + (B[k + 2] - A[k + 2]) * f + bz
      appear[i] = THREE.MathUtils.smoothstep(reveal.current.v, sd, sd + 0.14)
    }
    nodeGeo.attributes.position.needsUpdate = true

    // rebuild proximity edges
    let v = 0
    let pairs = 0
    for (let i = 0; i < N && pairs < MAX_PAIRS; i++) {
      const ai = i * 3
      const ax = cur[ai], ay = cur[ai + 1], az = cur[ai + 2]
      const reA = appear[i]
      if (reA <= 0.01) continue
      for (let j = i + 1; j < N && pairs < MAX_PAIRS; j++) {
        const bj = j * 3
        const dx = ax - cur[bj]
        const dy = ay - cur[bj + 1]
        const dz = az - cur[bj + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < THRESH2) {
          const bright = (1 - Math.sqrt(d2) / THRESH) * reA * appear[j]
          const r = 0.42 * bright
          const g = 1.0 * bright
          const b = 0.14 * bright
          edgePos[v] = ax; edgePos[v + 1] = ay; edgePos[v + 2] = az
          edgeCol[v] = r; edgeCol[v + 1] = g; edgeCol[v + 2] = b
          v += 3
          edgePos[v] = cur[bj]; edgePos[v + 1] = cur[bj + 1]; edgePos[v + 2] = cur[bj + 2]
          edgeCol[v] = r; edgeCol[v + 1] = g; edgeCol[v + 2] = b
          v += 3
          pairs++
        }
      }
    }
    edgeGeo.setDrawRange(0, pairs * 2)
    edgeGeo.attributes.position.needsUpdate = true
    edgeGeo.attributes.color.needsUpdate = true

    // packets travelling along node pairs
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i]
      if (!reduced) pk.t += pk.speed * dt
      if (pk.t >= 1) {
        pk.t = 0
        pk.a = (Math.random() * N) | 0
        pk.b = (Math.random() * N) | 0
        pk.speed = 0.25 + Math.random() * 0.5
      }
      const ai = pk.a * 3
      const bi = pk.b * 3
      const tt = easeInOut(pk.t)
      const pk3 = i * 3
      packetPos[pk3] = cur[ai] + (cur[bi] - cur[ai]) * tt
      packetPos[pk3 + 1] = cur[ai + 1] + (cur[bi + 1] - cur[ai + 1]) * tt
      packetPos[pk3 + 2] = cur[ai + 2] + (cur[bi + 2] - cur[ai + 2]) * tt
    }
    packetGeo.attributes.position.needsUpdate = true

    // group parallax from pointer + slow idle drift
    if (groupRef.current) {
      const tgtY = scrollState.mouseX * 0.16 + (reduced ? 0 : t * 0.02)
      const tgtX = scrollState.mouseY * 0.1
      groupRef.current.rotation.y = damp(groupRef.current.rotation.y, tgtY, 3, dt)
      groupRef.current.rotation.x = damp(groupRef.current.rotation.x, tgtX, 3, dt)
    }
  })

  // dispose on unmount
  useEffect(() => {
    return () => {
      nodeGeo.dispose(); nodeMat.dispose()
      edgeGeo.dispose(); edgeMat.dispose()
      packetGeo.dispose(); packetMat.dispose()
    }
  }, [nodeGeo, nodeMat, edgeGeo, edgeMat, packetGeo, packetMat])

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeo} material={edgeMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
      <points geometry={packetGeo} material={packetMat} frustumCulled={false} />
    </group>
  )
}
