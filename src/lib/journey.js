import * as THREE from 'three'

// "Signal Flow" — the camera flies along a serpentine 3D curve toward -Z, through a
// set of real-looking automation workflows, passing six content stations.

const CAM = [
  [0, 1.2, 12],    // 0 hero
  [-6, 2.0, -18],  // 1 services
  [4, 1.0, -48],   // 2 process
  [-3, 3.5, -80],  // 3 cases
  [0, 0.5, -112],  // 4 duo
  [0, 2.0, -146],  // 5 contact
  [0, 1.6, -176],  // outro
]

const LOOK = [
  [0, 1.2, 0],
  [-2, 1.6, -34],
  [0, 1.0, -66],
  [3, 2.6, -98],
  [0, 1.2, -130],
  [0, 1.4, -164],
  [0, 1.4, -192],
]

const PANEL = [
  [0, 1.2, 0],
  [-2, 1.6, -34],
  [0, 1.0, -66],
  [3, 2.6, -98],
  [0, 1.2, -130],
  [0, 1.4, -164],
]

const toVec = (a) => new THREE.Vector3(a[0], a[1], a[2])
const clamp01 = (x) => Math.min(1, Math.max(0, x))

export const camCurve = new THREE.CatmullRomCurve3(CAM.map(toVec), false, 'catmullrom', 0.5)
export const lookCurve = new THREE.CatmullRomCurve3(LOOK.map(toVec), false, 'catmullrom', 0.5)

export const STATION_KEYS = ['hero', 'services', 'process', 'cases', 'duo', 'cta']

export const STATIONS = STATION_KEYS.map((key, i) => {
  const p = PANEL[i]
  const cam = CAM[i]
  const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2])
  return { key, at: i / (CAM.length - 1), pos: p, rot: [0, yaw, 0] }
})

export const SCROLL_PAGES = 6

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

// Labels that make the graph read as real automations.
const TRIGGERS = ['Webhook', 'Cron', 'Form', 'New email', 'New row', 'Stripe']
const APPS = ['n8n', 'OpenAI', 'Claude', 'Supabase', 'Notion', 'Sheets', 'Airtable', 'Slack', 'HubSpot', 'Make', 'Python', 'Gmail']
const STEPS = ['Filter', 'Map', 'Agent IA', 'Enrich', 'Route', 'Format', 'Upsert', 'Notify']

/**
 * Build a set of small directed workflows scattered along the camera corridor.
 * Each workflow is a trigger -> steps -> output chain (n8n style), with labelled
 * integration nodes and curved connectors. Plus a sparse ambient particle haze.
 */
export function buildGraph() {
  const rnd = mulberry32(91237)
  const nodes = [] // { x,y,z,size,seed,glow,label,ambient }
  const edges = [] // { a, b, ctrl:[x,y,z] }

  const PIPES = 15
  for (let p = 0; p < PIPES; p++) {
    const t0 = clamp01(0.015 + (p / PIPES) * 0.95 + rnd() * 0.012)
    const baseAng = rnd() * Math.PI * 2
    const radius = 3 + rnd() * 7.5 // some hug the path (fly-through), some frame it
    const len = 3 + ((rnd() * 3) | 0) // 3..5 nodes
    let prev = -1
    for (let s = 0; s < len; s++) {
      const tt = clamp01(t0 + s * 0.011)
      const cp = camCurve.getPoint(tt)
      const ang = baseAng + s * 0.7
      const idx = nodes.length
      let label = null
      if (s === 0) label = TRIGGERS[(p + s) % TRIGGERS.length]
      else if (s === len - 1) label = APPS[(p * 2 + s) % APPS.length]
      else label = rnd() < 0.6 ? STEPS[(p + s) % STEPS.length] : APPS[(p + s) % APPS.length]

      nodes.push({
        x: cp.x + Math.cos(ang) * radius,
        y: cp.y + (rnd() * 2 - 1) * 3.2,
        z: cp.z + Math.sin(ang) * radius * 0.6 - s * 2.2,
        size: s === 0 ? 22 : s === len - 1 ? 18 : 11,
        seed: rnd(),
        glow: s === 0 || s === len - 1 ? 1 : 0.6,
        label,
        terminal: s === 0 || s === len - 1, // trigger + output get a label chip
        ambient: false,
      })
      if (prev >= 0) {
        const A = nodes[prev]
        const B = nodes[idx]
        // n8n-style bow: control point pushed perpendicular in xz + a little up
        const mx = (A.x + B.x) / 2
        const my = (A.y + B.y) / 2
        const mz = (A.z + B.z) / 2
        const dx = B.x - A.x
        const dz = B.z - A.z
        const len2 = Math.hypot(dx, dz) || 1
        const bow = 0.35 * len2
        edges.push({ a: prev, b: idx, ctrl: [mx - (dz / len2) * bow, my + 1.1, mz + (dx / len2) * bow] })
      }
      prev = idx
    }
  }

  // ambient particles for depth (no connections)
  const AMB = 340
  for (let i = 0; i < AMB; i++) {
    const t = rnd()
    const cp = camCurve.getPoint(t)
    nodes.push({
      x: cp.x + (rnd() * 2 - 1) * 17,
      y: cp.y + (rnd() * 2 - 1) * 9,
      z: cp.z + (rnd() * 2 - 1) * 17,
      size: 1.6 + rnd() * 3,
      seed: rnd(),
      glow: rnd() * 0.25,
      label: null,
      ambient: true,
    })
  }

  return { nodes, edges }
}
