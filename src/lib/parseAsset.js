import * as THREE from 'three'

export const MODEL_EXT = ['glb', 'gltf', 'obj', 'fbx']
export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'tga', 'exr', 'bmp']
// tga / exr ne se décodent pas via <img> — acceptés mais sans aperçu pixel.
const IMG_DECODABLE = ['png', 'jpg', 'jpeg', 'webp', 'bmp']

export const extOf = (name) => (name.split('.').pop() || '').toLowerCase()
export const baseName = (name) => name.replace(/\.[^.]+$/, '')
export const isModelFile = (f) => MODEL_EXT.includes(extOf(f.name))
export const isImageFile = (f) => IMAGE_EXT.includes(extOf(f.name))

export function groupOf(file) {
  if (isModelFile(file)) return 'model'
  if (isImageFile(file)) return 'image'
  return 'other'
}

// Rôles de texture (PBR) — pour rattacher des maps à un modèle 3D.
export const MAP_ROLES = [
  { id: 'albedo', label: 'Albedo' },
  { id: 'normal', label: 'Normal' },
  { id: 'roughness', label: 'Roughness' },
  { id: 'metalness', label: 'Metalness' },
  { id: 'ao', label: 'AO' },
  { id: 'emissive', label: 'Emissive' },
  { id: 'height', label: 'Height' },
  { id: 'opacity', label: 'Opacity' },
  { id: 'orm', label: 'ORM' },
  { id: 'other', label: 'Other' },
]
export const ROLE_LABEL = Object.fromEntries(MAP_ROLES.map((r) => [r.id, r.label]))

// Devine le rôle d'une map depuis son nom de fichier (conventions courantes des DCC).
// Ex : crate_Normal.png → normal, hero_basecolor.jpg → albedo, wood_r.png → roughness.
export function detectMapRole(filename) {
  const b = baseName(filename).toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const tokens = b.split('_').filter(Boolean)
  const has = (...w) => w.some((x) => b.includes(x))
  const ends = (...c) => c.some((x) => b.endsWith('_' + x))
  const tok = (...c) => c.some((x) => tokens.includes(x)) // match par token (évite "n[orm]al" → orm)
  if (tok('orm') || ends('orm')) return 'orm'
  if (has('albedo', 'basecolor', 'base_color', 'diffuse') || ends('alb', 'col', 'color', 'bc', 'diff', 'd')) return 'albedo'
  if (has('normal') || ends('nrm', 'norm', 'nor', 'n')) return 'normal'
  if (has('roughness', 'rough') || ends('rgh', 'r')) return 'roughness'
  if (has('metalness', 'metallic', 'metal') || ends('met', 'm')) return 'metalness'
  if (has('occlusion', 'ambient_occlusion') || ends('ao', 'occ')) return 'ao'
  if (has('emissive', 'emission') || ends('emit', 'e')) return 'emissive'
  if (has('height', 'displacement', 'displace', 'bump') || ends('disp', 'height', 'bump', 'h')) return 'height'
  if (has('opacity', 'alpha') || ends('opacity', 'alpha', 'mask')) return 'opacity'
  return 'other'
}

export function formatBytes(b) {
  if (!b) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = b
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + u[i]
}

export function classifyRes(maxDim) {
  const m = Math.max(maxDim || 0, 0)
  if (m <= 0) return '—'
  if (m <= 1024) return '1K'
  if (m <= 2048) return '2K'
  if (m <= 4096) return '4K'
  return '8K'
}

// Lit les dimensions réelles d'une image (px). tga/exr → 0×0 (non décodable en <img>).
export function loadImageMeta(file) {
  const url = URL.createObjectURL(file)
  if (!IMG_DECODABLE.includes(extOf(file.name))) {
    return Promise.resolve({ url, width: 0, height: 0, decodable: false })
  }
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight, decodable: true })
    img.onerror = () => resolve({ url, width: 0, height: 0, decodable: false })
    img.src = url
  })
}

// Compte les triangles d'un Object3D (indexé ou non).
export function countTris(object3d) {
  let tris = 0
  object3d.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry
      if (g.index) tris += g.index.count / 3
      else if (g.attributes?.position) tris += g.attributes.position.count / 3
    }
  })
  return Math.round(tris)
}

// Parse un fichier modèle avec le bon loader three.js (import dynamique).
export async function parseModel(file) {
  const ext = extOf(file.name)
  try {
    if (ext === 'obj') {
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
      const obj = new OBJLoader().parse(await file.text())
      return { object3d: obj, tris: countTris(obj) }
    }
    if (ext === 'glb') {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const buf = await file.arrayBuffer()
      const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej))
      return { object3d: gltf.scene, tris: countTris(gltf.scene) }
    }
    if (ext === 'gltf') {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const text = await file.text()
      const gltf = await new Promise((res, rej) => new GLTFLoader().parse(text, '', res, rej))
      return { object3d: gltf.scene, tris: countTris(gltf.scene) }
    }
    if (ext === 'fbx') {
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')
      const obj = new FBXLoader().parse(await file.arrayBuffer(), '')
      return { object3d: obj, tris: countTris(obj) }
    }
  } catch (e) {
    console.warn('[parseModel] failed for', file.name, e)
    return { object3d: null, tris: null, error: e?.message || 'parse error' }
  }
  return { object3d: null, tris: null }
}
