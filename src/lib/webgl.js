// Détection légère du support WebGL — on évite de monter un <Canvas>
// si le navigateur ne sait pas faire (sinon react-three-fiber crash).
let cached = null

export function hasWebGL() {
  if (cached !== null) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    cached = false
  }
  return cached
}
