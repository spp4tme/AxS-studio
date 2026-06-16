// Pre-computed node layouts, one per section "beat".
// The network morphs between consecutive layouts as the page scrolls.
// Order: hero(chaos) -> services(clusters) -> process(chain) -> cases(layers) -> duo(split) -> cta(collapse)

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const LAYOUT_COUNT = 6

export function buildLayouts(N) {
  const rnd = mulberry32(20240616)
  const r = () => rnd()
  const rs = () => rnd() * 2 - 1 // -1..1

  const chaos = new Float32Array(N * 3)
  const clusters = new Float32Array(N * 3)
  const chain = new Float32Array(N * 3)
  const layers = new Float32Array(N * 3)
  const split = new Float32Array(N * 3)
  const collapse = new Float32Array(N * 3)

  const clusterCenters = [
    [-4.3, 0.4, 0.2],
    [0.0, -0.3, -0.4],
    [4.3, 0.5, 0.3],
  ]
  const layerZ = [3.4, 0.9, -1.6, -4.2]

  for (let i = 0; i < N; i++) {
    const k = i * 3

    // 0 — chaos: organic cloud in an ellipsoid
    const u = r() * Math.PI * 2
    const v = Math.acos(2 * r() - 1)
    const rad = Math.cbrt(r()) // uniform-ish in volume
    chaos[k] = Math.sin(v) * Math.cos(u) * rad * 6.2
    chaos[k + 1] = Math.cos(v) * rad * 3.4
    chaos[k + 2] = Math.sin(v) * Math.sin(u) * rad * 4.2

    // 1 — clusters: three grapes
    const c = clusterCenters[i % 3]
    clusters[k] = c[0] + rs() * 1.45
    clusters[k + 1] = c[1] + rs() * 1.35
    clusters[k + 2] = c[2] + rs() * 1.3

    // 2 — chain: a slightly wavy horizontal pipeline
    const tx = i / (N - 1)
    chain[k] = (tx - 0.5) * 14.4 + rs() * 0.25
    chain[k + 1] = Math.sin(tx * Math.PI * 6) * 0.5 + rs() * 0.28
    chain[k + 2] = Math.cos(tx * Math.PI * 4) * 0.4 + rs() * 0.3

    // 3 — layers: stacked depth planes
    const layer = i % 4
    layers[k] = rs() * 5.4
    layers[k + 1] = rs() * 2.7
    layers[k + 2] = layerZ[layer] + rs() * 0.3

    // 4 — split: two mirrored sub-graphs, a few nodes bridge the centre
    if (i < 6) {
      // bridge nodes near the axis
      split[k] = rs() * 1.3
      split[k + 1] = rs() * 1.0
      split[k + 2] = rs() * 0.6
    } else {
      const sign = i % 2 === 0 ? -1 : 1
      split[k] = sign * 3.7 + rs() * 1.5
      split[k + 1] = rs() * 1.9
      split[k + 2] = rs() * 1.4
    }

    // 5 — collapse: implosion toward the focal point
    const cu = r() * Math.PI * 2
    const cv = Math.acos(2 * r() - 1)
    const cr = 0.35 + r() * 0.6
    collapse[k] = Math.sin(cv) * Math.cos(cu) * cr
    collapse[k + 1] = Math.cos(cv) * cr * 0.8
    collapse[k + 2] = Math.sin(cv) * Math.sin(cu) * cr
  }

  return [chaos, clusters, chain, layers, split, collapse]
}

// Camera keyframes aligned to each layout. pos = eye, look = target.
export const CAMERA_KEYS = [
  { pos: [0.0, 0.1, 8.6], look: [0, 0, 0] },     // hero — deep in the core
  { pos: [0.0, 0.2, 12.2], look: [0, 0, 0] },    // services — pull back, triptych
  { pos: [0.0, 0.7, 12.8], look: [0, 0, 0] },    // process — side-on travelling
  { pos: [4.6, 0.9, 10.4], look: [0, 0, -0.6] }, // cases — orbit, reveal depth
  { pos: [0.0, 0.0, 11.6], look: [0, 0, 0] },    // duo — centred, symmetric
  { pos: [0.0, 0.0, 5.4], look: [0, 0, 0] },     // cta — implosive push-in
]
