import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Générateurs de textures procédurales (dessinées au canvas).
 * Chaque motif est dessiné de façon (à peu près) raccordable pour
 * pouvoir être répété en tuile, à la fois pour l'aperçu 2D des cards
 * et comme THREE.CanvasTexture sur les objets 3D.
 * ------------------------------------------------------------------ */

// PRNG déterministe (mulberry32) : même seed => même texture à chaque rendu.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// f dans [-1, 1] : négatif = assombrir, positif = éclaircir
function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex)
  if (f < 0) {
    const k = 1 + f
    return `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`
  }
  return `rgb(${(r + (255 - r) * f) | 0},${(g + (255 - g) * f) | 0},${(b + (255 - b) * f) | 0})`
}

function fill(ctx, color, s) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, s, s)
}

const PATTERNS = {
  bricks(ctx, s, p, rnd) {
    fill(ctx, p.accent, s)
    const bw = s / 4
    const bh = s / 8
    for (let row = 0; row * bh < s; row++) {
      const off = row % 2 ? bw / 2 : 0
      for (let x = -bw; x < s; x += bw) {
        ctx.fillStyle = shade(p.base, (rnd() - 0.5) * 0.3)
        ctx.fillRect(x + off + 2, row * bh + 2, bw - 4, bh - 4)
      }
    }
  },

  wood(ctx, s, p, rnd) {
    fill(ctx, p.base, s)
    for (let i = 0; i < s; i += 2) {
      const t = i / s
      ctx.strokeStyle = shade(p.base, Math.sin(t * Math.PI * 6 + rnd()) * 0.12 - 0.04)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, s)
      ctx.stroke()
    }
    // quelques nœuds
    for (let k = 0; k < 3; k++) {
      const x = rnd() * s
      const y = rnd() * s
      const r = 4 + rnd() * 8
      ctx.strokeStyle = shade(p.accent, -0.1)
      for (let rr = r; rr > 1; rr -= 3) {
        ctx.beginPath()
        ctx.ellipse(x, y, rr, rr * 1.6, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  },

  metal(ctx, s, p) {
    const g = ctx.createLinearGradient(0, 0, 0, s)
    g.addColorStop(0, shade(p.base, 0.18))
    g.addColorStop(0.5, shade(p.base, -0.05))
    g.addColorStop(1, shade(p.base, 0.1))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    ctx.globalAlpha = 0.06
    for (let y = 0; y < s; y += 1) {
      ctx.strokeStyle = y % 2 ? '#ffffff' : '#000000'
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(s, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  },

  checker(ctx, s, p) {
    fill(ctx, p.accent, s)
    const c = s / 8
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = p.base
          ctx.fillRect(x * c, y * c, c, c)
        }
      }
    }
  },

  grid(ctx, s, p) {
    fill(ctx, p.base, s)
    ctx.strokeStyle = p.accent
    ctx.lineWidth = 1.5
    const c = s / 8
    ctx.globalAlpha = 0.55
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath()
      ctx.moveTo(i * c, 0)
      ctx.lineTo(i * c, s)
      ctx.moveTo(0, i * c)
      ctx.lineTo(s, i * c)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = p.accent
    for (let y = 0; y <= 8; y++)
      for (let x = 0; x <= 8; x++) {
        ctx.fillRect(x * c - 1.5, y * c - 1.5, 3, 3)
      }
  },

  dots(ctx, s, p) {
    fill(ctx, p.base, s)
    const c = s / 6
    ctx.fillStyle = p.accent
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        ctx.beginPath()
        ctx.arc(x * c + c / 2, y * c + c / 2, c * 0.28, 0, Math.PI * 2)
        ctx.fill()
      }
  },

  hexagons(ctx, s, p) {
    fill(ctx, p.base, s)
    const r = s / 8
    const h = Math.sqrt(3) * r
    ctx.strokeStyle = p.accent
    ctx.lineWidth = 2
    for (let row = -1; row * (h * 0.75) < s + h; row++) {
      for (let col = -1; col * (r * 1.5) < s + r; col++) {
        const cx = col * r * 1.5
        const cy = row * h + (col % 2 ? h / 2 : 0)
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i
          const px = cx + r * Math.cos(a)
          const py = cy + r * Math.sin(a)
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
      }
    }
  },

  circuit(ctx, s, p, rnd) {
    fill(ctx, p.base, s)
    ctx.strokeStyle = p.accent
    ctx.fillStyle = p.accent
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.85
    const step = s / 8
    for (let i = 0; i < 22; i++) {
      let x = Math.floor(rnd() * 8) * step
      let y = Math.floor(rnd() * 8) * step
      ctx.beginPath()
      ctx.moveTo(x, y)
      const segs = 2 + Math.floor(rnd() * 3)
      for (let sgi = 0; sgi < segs; sgi++) {
        if (rnd() > 0.5) x += (rnd() > 0.5 ? 1 : -1) * step
        else y += (rnd() > 0.5 ? 1 : -1) * step
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },

  lava(ctx, s, p, rnd) {
    fill(ctx, p.base, s)
    for (let i = 0; i < 60; i++) {
      const x = rnd() * s
      const y = rnd() * s
      const r = 6 + rnd() * 26
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, shade(p.accent, 0.2))
      g.addColorStop(0.6, p.accent)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },

  fabric(ctx, s, p) {
    fill(ctx, p.base, s)
    const c = s / 16
    ctx.lineWidth = c * 0.6
    for (let i = 0; i < 16; i++) {
      ctx.strokeStyle = shade(p.base, i % 2 ? 0.1 : -0.1)
      ctx.beginPath()
      ctx.moveTo(i * c, 0)
      ctx.lineTo(i * c, s)
      ctx.stroke()
      ctx.strokeStyle = shade(p.accent, i % 2 ? -0.05 : 0.08)
      ctx.beginPath()
      ctx.moveTo(0, i * c + c / 2)
      ctx.lineTo(s, i * c + c / 2)
      ctx.stroke()
    }
  },

  stone(ctx, s, p, rnd) {
    fill(ctx, p.accent, s)
    const cells = 5
    const c = s / cells
    for (let y = 0; y < cells; y++)
      for (let x = 0; x < cells; x++) {
        ctx.fillStyle = shade(p.base, (rnd() - 0.5) * 0.4)
        const jx = (rnd() - 0.5) * 4
        const jy = (rnd() - 0.5) * 4
        ctx.beginPath()
        const pad = 3
        ctx.roundRect
          ? ctx.roundRect(x * c + pad + jx, y * c + pad + jy, c - pad * 2, c - pad * 2, 6)
          : ctx.rect(x * c + pad + jx, y * c + pad + jy, c - pad * 2, c - pad * 2)
        ctx.fill()
      }
  },

  sand(ctx, s, p, rnd) {
    fill(ctx, p.base, s)
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = shade(rnd() > 0.5 ? p.base : p.accent, (rnd() - 0.5) * 0.4)
      ctx.fillRect(rnd() * s, rnd() * s, 1.4, 1.4)
    }
  },
}

export const PATTERN_KEYS = Object.keys(PATTERNS)

// Dessine un motif sur un contexte canvas existant.
export function drawPattern(ctx, pattern, size, palette, seed = 1) {
  const fn = PATTERNS[pattern] || PATTERNS.checker
  const rnd = mulberry32(seed * 2654435761)
  ctx.clearRect(0, 0, size, size)
  fn(ctx, size, palette, rnd)
}

// Fabrique une THREE.CanvasTexture répétable (pour le mapping 3D).
export function makeCanvasTexture(pattern, palette, seed = 1, size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  drawPattern(ctx, pattern, size, palette, seed)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}
