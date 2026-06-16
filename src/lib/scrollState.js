// Mutable singleton read every frame by the WebGL scene.
// Never triggers React re-renders — the canvas polls it inside useFrame.
export const scrollState = {
  progress: 0,        // 0..1 across the whole page (drives the 3D layout morph)
  velocity: 0,        // Lenis scroll velocity (px/frame-ish)
  targetMouseX: 0,    // -1..1, raw pointer
  targetMouseY: 0,
  mouseX: 0,          // smoothed pointer (updated in useFrame)
  mouseY: 0,
  reduced: false,     // prefers-reduced-motion
}
