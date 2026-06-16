import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { buildField } from '../lib/journey'
import { scrollState } from '../lib/scrollState'

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
    float appear = smoothstep(aSeed, aSeed + 0.16, uReveal);
    vReveal = appear;
    vGlow = aGlow;
    float pulse = 0.82 + 0.18 * sin(uTime * 1.6 + aSeed * 31.0);
    float size = aSize * pulse * appear;
    gl_PointSize = size * uPixelRatio * (9.0 / -mvPosition.z);
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
    gl_FragColor = vec4(col * intensity, core * vReveal);
  }
`

const PACKET_VERT = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * (9.0 / -mvPosition.z);
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

export function NodeField({ count = 800, packetCount = 40 }) {
  const N = count
  const reveal = useRef({ v: 0 })
  const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.75)

  const field = useMemo(() => buildField(N), [N])

  // Node points
  const { nodeGeo, nodeMat, cur } = useMemo(() => {
    const cur = new Float32Array(N * 3)
    cur.set(field.base)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(cur, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSize', new THREE.BufferAttribute(field.sizes, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(field.seeds, 1))
    g.setAttribute('aGlow', new THREE.BufferAttribute(field.glows, 1))
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
    return { nodeGeo: g, nodeMat: m, cur }
  }, [N, field, DPR])

  // Edges (static topology, endpoints follow breathing)
  const { edgeGeo, edgeMat, edgePos } = useMemo(() => {
    const edgePos = new Float32Array(field.edgeCount * 2 * 3)
    const edgeCol = new Float32Array(field.edgeCount * 2 * 3)
    // bake colours once: dimmer green, additive + bloom does the rest
    for (let e = 0; e < field.edgeCount; e++) {
      for (let s = 0; s < 2; s++) {
        const o = (e * 2 + s) * 3
        edgeCol[o] = 0.32
        edgeCol[o + 1] = 0.7
        edgeCol[o + 2] = 0.1
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(edgePos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3))
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { edgeGeo: g, edgeMat: m, edgePos }
  }, [field])

  // Packets travelling along edges
  const { packetGeo, packetMat, packetPos, packets } = useMemo(() => {
    const packetPos = new Float32Array(packetCount * 3)
    const packets = []
    for (let i = 0; i < packetCount; i++) {
      packets.push({ e: (Math.random() * field.edgeCount) | 0, t: Math.random(), speed: 0.3 + Math.random() * 0.7 })
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(packetPos, 3).setUsage(THREE.DynamicDrawUsage))
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: DPR },
        uSize: { value: 10 },
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
  }, [packetCount, field, DPR])

  useEffect(() => {
    if (scrollState.reduced) {
      reveal.current.v = 1
      nodeMat.uniforms.uReveal.value = 1
      edgeMat.opacity = 0.9
      return
    }
    const tween = gsap.to(reveal.current, { v: 1, duration: 2.2, ease: 'power2.out', delay: 0.2 })
    return () => tween.kill()
  }, [nodeMat, edgeMat])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const t = state.clock.elapsedTime
    const reduced = scrollState.reduced
    const rv = reveal.current.v

    nodeMat.uniforms.uReveal.value = rv
    nodeMat.uniforms.uTime.value = t
    edgeMat.opacity = THREE.MathUtils.lerp(edgeMat.opacity, rv * 0.85, 0.1)

    // breathing node positions
    const breath = reduced ? 0 : 1
    const base = field.base
    for (let i = 0; i < N; i++) {
      const k = i * 3
      const sd = field.seeds[i]
      cur[k] = base[k] + breath * Math.sin(t * 0.5 + sd * 12.0) * 0.16
      cur[k + 1] = base[k + 1] + breath * Math.cos(t * 0.42 + sd * 9.0) * 0.16
      cur[k + 2] = base[k + 2] + breath * Math.sin(t * 0.36 + sd * 15.0) * 0.16
    }
    nodeGeo.attributes.position.needsUpdate = true

    // write edge endpoints from current node positions
    const ea = field.ea, eb = field.eb
    let o = 0
    for (let e = 0; e < field.edgeCount; e++) {
      const a = ea[e] * 3, b = eb[e] * 3
      edgePos[o] = cur[a]; edgePos[o + 1] = cur[a + 1]; edgePos[o + 2] = cur[a + 2]; o += 3
      edgePos[o] = cur[b]; edgePos[o + 1] = cur[b + 1]; edgePos[o + 2] = cur[b + 2]; o += 3
    }
    edgeGeo.attributes.position.needsUpdate = true

    // packets
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i]
      if (!reduced) pk.t += pk.speed * dt
      if (pk.t >= 1) {
        pk.t = 0
        pk.e = (Math.random() * field.edgeCount) | 0
        pk.speed = 0.3 + Math.random() * 0.7
      }
      const a = ea[pk.e] * 3, b = eb[pk.e] * 3
      const tt = easeInOut(pk.t)
      const pk3 = i * 3
      packetPos[pk3] = cur[a] + (cur[b] - cur[a]) * tt
      packetPos[pk3 + 1] = cur[a + 1] + (cur[b + 1] - cur[a + 1]) * tt
      packetPos[pk3 + 2] = cur[a + 2] + (cur[b + 2] - cur[a + 2]) * tt
    }
    packetGeo.attributes.position.needsUpdate = true
  })

  useEffect(() => {
    return () => {
      nodeGeo.dispose(); nodeMat.dispose()
      edgeGeo.dispose(); edgeMat.dispose()
      packetGeo.dispose(); packetMat.dispose()
    }
  }, [nodeGeo, nodeMat, edgeGeo, edgeMat, packetGeo, packetMat])

  return (
    <group>
      <lineSegments geometry={edgeGeo} material={edgeMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
      <points geometry={packetGeo} material={packetMat} frustumCulled={false} />
    </group>
  )
}
