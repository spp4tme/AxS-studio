import * as THREE from 'three'

// "Signal Flow" — the camera flies along a serpentine 3D curve toward -Z, through a
// node field, passing six content stations anchored in space. Scroll offset (0..1)
// maps directly onto these curves (sampled with getPoint so waypoints stay synced).

// Camera waypoints (eye). Station i is viewed from CAM[i] at scroll offset i/(N-1).
// Index 0 = hero (visible on load), last = lead-out.
const CAM = [
  [0, 1.2, 12],    // 0 hero
  [-6, 2.0, -18],  // 1 services
  [4, 1.0, -48],   // 2 process
  [-3, 3.5, -80],  // 3 cases
  [0, 0.5, -112],  // 4 duo
  [0, 2.0, -146],  // 5 contact
  [0, 1.6, -176],  // outro
]

// Look targets, aligned 1:1 with CAM — each station looks straight at its panel.
const LOOK = [
  [0, 1.2, 0],      // hero panel
  [-2, 1.6, -34],   // services panel
  [0, 1.0, -66],    // process panel
  [3, 2.6, -98],    // cases panel
  [0, 1.2, -130],   // duo panel
  [0, 1.4, -164],   // cta panel
  [0, 1.4, -192],   // outro looks ahead
]

// Content panel anchors (one per station).
const PANEL = [
  [0, 1.2, 0],      // hero
  [-2, 1.6, -34],   // services
  [0, 1.0, -66],    // process
  [3, 2.6, -98],    // cases
  [0, 1.2, -130],   // duo
  [0, 1.4, -164],   // cta
]

const toVec = (a) => new THREE.Vector3(a[0], a[1], a[2])

export const camCurve = new THREE.CatmullRomCurve3(CAM.map(toVec), false, 'catmullrom', 0.5)
export const lookCurve = new THREE.CatmullRomCurve3(LOOK.map(toVec), false, 'catmullrom', 0.5)

export const STATION_KEYS = ['hero', 'services', 'process', 'cases', 'duo', 'cta']

export const STATIONS = STATION_KEYS.map((key, i) => {
  const p = PANEL[i]
  const cam = CAM[i] // station i is viewed from CAM[i]
  const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]) // face the viewing camera
  return {
    key,
    at: i / (CAM.length - 1),
    pos: p,
    rot: [0, yaw, 0],
  }
})

export const SCROLL_PAGES = 9

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

/**
 * Node field hugging the camera corridor, denser near each station.
 * Edges are precomputed (static topology); endpoints follow per-node breathing.
 */
export function buildField(N) {
  const rnd = mulberry32(73108)
  const base = new Float32Array(N * 3)
  const sizes = new Float32Array(N)
  const seeds = new Float32Array(N)
  const glows = new Float32Array(N)

  const clusterCount = Math.floor(N * 0.45)
  for (let i = 0; i < N; i++) {
    const k = i * 3
    let x, y, z
    if (i < clusterCount) {
      const st = PANEL[(rnd() * PANEL.length) | 0]
      const r = 2 + rnd() * 5.5
      const u = rnd() * Math.PI * 2
      const v = Math.acos(2 * rnd() - 1)
      x = st[0] + Math.sin(v) * Math.cos(u) * r
      y = st[1] + Math.cos(v) * r * 0.7
      z = st[2] + Math.sin(v) * Math.sin(u) * r
    } else {
      const t = rnd()
      const p = camCurve.getPoint(t)
      const r = 3.5 + rnd() * 9
      const u = rnd() * Math.PI * 2
      x = p.x + Math.cos(u) * r
      y = p.y + (rnd() * 2 - 1) * 6.5
      z = p.z + Math.sin(u) * r
    }
    base[k] = x
    base[k + 1] = y
    base[k + 2] = z
    const hub = rnd() < 0.14
    sizes[i] = hub ? 16 + rnd() * 12 : 5 + rnd() * 6
    seeds[i] = rnd()
    glows[i] = hub ? 0.8 + rnd() * 0.2 : rnd() * 0.45
  }

  // Static edges: link each node to a few near neighbours within a radius.
  const THRESH2 = 7 * 7
  const MAX_EDGES = Math.min(2800, N * 4)
  const ea = new Int32Array(MAX_EDGES)
  const eb = new Int32Array(MAX_EDGES)
  let edgeCount = 0
  for (let i = 0; i < N && edgeCount < MAX_EDGES; i++) {
    const ax = base[i * 3], ay = base[i * 3 + 1], az = base[i * 3 + 2]
    let made = 0
    for (let j = i + 1; j < N && made < 3 && edgeCount < MAX_EDGES; j++) {
      const dx = ax - base[j * 3]
      const dy = ay - base[j * 3 + 1]
      const dz = az - base[j * 3 + 2]
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 < THRESH2) {
        ea[edgeCount] = i
        eb[edgeCount] = j
        edgeCount++
        made++
      }
    }
  }

  return { base, sizes, seeds, glows, ea, eb, edgeCount }
}
