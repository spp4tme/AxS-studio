import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gsap } from 'gsap'
import { buildGraph } from '../lib/journey'
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
    vReveal = appear; vGlow = aGlow;
    float pulse = 0.8 + 0.2 * sin(uTime * 1.7 + aSeed * 31.0);
    gl_PointSize = aSize * pulse * appear * uPixelRatio * (9.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`
const NODE_FRAG = /* glsl */ `
  uniform vec3 uColorCore; uniform vec3 uColorGlow;
  varying float vGlow; varying float vReveal;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorGlow, uColorCore, core * core);
    float intensity = (0.35 + core * 1.3) * (0.6 + vGlow * 1.1);
    gl_FragColor = vec4(col * intensity, core * vReveal);
  }
`

const EDGE_VERT = /* glsl */ `
  attribute float aDist;
  varying float vDist;
  void main() { vDist = aDist; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const EDGE_FRAG = /* glsl */ `
  uniform float uTime; uniform float uReveal;
  uniform vec3 uDim; uniform vec3 uBright;
  varying float vDist;
  void main() {
    float flow = fract(vDist - uTime * 0.16);
    float head = smoothstep(0.0, 0.05, flow) * smoothstep(0.24, 0.06, flow);
    vec3 col = mix(uDim, uBright, head);
    float a = (0.16 + head * 1.5) * uReveal;
    gl_FragColor = vec4(col * (0.5 + head * 2.2), a);
  }
`

const PACKET_VERT = /* glsl */ `
  uniform float uPixelRatio; uniform float uSize;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * (9.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`
const PACKET_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * (0.6 + core * 2.4), core);
  }
`

export function WorkflowField({ showLabels = true, portal }) {
  const reveal = useRef({ v: 0 })
  const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.75)
  const graph = useMemo(() => buildGraph(), [])

  // labelled nodes (triggers + outputs only, to stay legible)
  const labels = useMemo(
    () => graph.nodes.filter((n) => n.label && n.terminal),
    [graph],
  )

  // ---- nodes ----
  const { nodeGeo, nodeMat } = useMemo(() => {
    const N = graph.nodes.length
    const pos = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const seed = new Float32Array(N)
    const glow = new Float32Array(N)
    graph.nodes.forEach((n, i) => {
      pos[i * 3] = n.x; pos[i * 3 + 1] = n.y; pos[i * 3 + 2] = n.z
      size[i] = n.size; seed[i] = n.seed; glow[i] = n.glow
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uReveal: { value: 0 }, uPixelRatio: { value: DPR },
        uColorCore: { value: new THREE.Color(1.7, 2.2, 1.2) },
        uColorGlow: { value: new THREE.Color(0.5, 1.25, 0.08) },
      },
      vertexShader: NODE_VERT, fragmentShader: NODE_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { nodeGeo: g, nodeMat: m }
  }, [graph, DPR])

  // ---- curved connectors with directional flow + packet curves ----
  const { edgeGeo, edgeMat, curves } = useMemo(() => {
    const SEG = 16
    const verts = graph.edges.length * (SEG - 1) * 2
    const pos = new Float32Array(verts * 3)
    const dist = new Float32Array(verts)
    const curves = []
    let o = 0, od = 0
    graph.edges.forEach((e) => {
      const A = graph.nodes[e.a], B = graph.nodes[e.b]
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(A.x, A.y, A.z),
        new THREE.Vector3(e.ctrl[0], e.ctrl[1], e.ctrl[2]),
        new THREE.Vector3(B.x, B.y, B.z),
      )
      curves.push(curve)
      const pts = curve.getPoints(SEG - 1)
      for (let s = 0; s < SEG - 1; s++) {
        const p0 = pts[s], p1 = pts[s + 1]
        pos[o] = p0.x; pos[o + 1] = p0.y; pos[o + 2] = p0.z; o += 3
        pos[o] = p1.x; pos[o + 1] = p1.y; pos[o + 2] = p1.z; o += 3
        dist[od++] = s / (SEG - 1)
        dist[od++] = (s + 1) / (SEG - 1)
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aDist', new THREE.BufferAttribute(dist, 1))
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uReveal: { value: 0 },
        uDim: { value: new THREE.Color(0.16, 0.4, 0.05) },
        uBright: { value: new THREE.Color(1.4, 2.6, 0.5) },
      },
      vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { edgeGeo: g, edgeMat: m, curves }
  }, [graph])

  // ---- packets travelling along the workflow connectors ----
  const { packetGeo, packetMat, packetPos, packets } = useMemo(() => {
    const P = Math.min(curves.length, 46)
    const packetPos = new Float32Array(P * 3)
    const packets = []
    for (let i = 0; i < P; i++) {
      packets.push({ e: (Math.random() * curves.length) | 0, t: Math.random(), speed: 0.18 + Math.random() * 0.5 })
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(packetPos, 3).setUsage(THREE.DynamicDrawUsage))
    const m = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: DPR }, uSize: { value: 11 }, uColor: { value: new THREE.Color(1.6, 2.8, 0.7) } },
      vertexShader: PACKET_VERT, fragmentShader: PACKET_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    m.toneMapped = false
    return { packetGeo: g, packetMat: m, packetPos, packets }
  }, [curves, DPR])

  useEffect(() => {
    if (scrollState.reduced) {
      reveal.current.v = 1
      nodeMat.uniforms.uReveal.value = 1
      edgeMat.uniforms.uReveal.value = 1
      return
    }
    const tw = gsap.to(reveal.current, { v: 1, duration: 2.2, ease: 'power2.out', delay: 0.2 })
    return () => tw.kill()
  }, [nodeMat, edgeMat])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const t = state.clock.elapsedTime
    const rv = reveal.current.v
    nodeMat.uniforms.uReveal.value = rv
    nodeMat.uniforms.uTime.value = t
    edgeMat.uniforms.uReveal.value = rv
    edgeMat.uniforms.uTime.value = t

    const reduced = scrollState.reduced
    const tmp = new THREE.Vector3()
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i]
      if (!reduced) pk.t += pk.speed * dt
      if (pk.t >= 1) { pk.t = 0; pk.e = (Math.random() * curves.length) | 0; pk.speed = 0.18 + Math.random() * 0.5 }
      curves[pk.e].getPoint(pk.t, tmp)
      packetPos[i * 3] = tmp.x; packetPos[i * 3 + 1] = tmp.y; packetPos[i * 3 + 2] = tmp.z
    }
    packetGeo.attributes.position.needsUpdate = true
  })

  useEffect(() => () => {
    nodeGeo.dispose(); nodeMat.dispose(); edgeGeo.dispose(); edgeMat.dispose(); packetGeo.dispose(); packetMat.dispose()
  }, [nodeGeo, nodeMat, edgeGeo, edgeMat, packetGeo, packetMat])

  return (
    <group>
      <lineSegments geometry={edgeGeo} material={edgeMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
      <points geometry={packetGeo} material={packetMat} frustumCulled={false} />
      {showLabels && labels.map((n, i) => (
        <group key={i} position={[n.x, n.y + 1.1, n.z]}>
          <Html center portal={portal} distanceFactor={26} zIndexRange={[80, 0]} style={{ pointerEvents: 'none' }}>
            <span className="wf-label mono">{n.label}</span>
          </Html>
        </group>
      ))}
    </group>
  )
}
