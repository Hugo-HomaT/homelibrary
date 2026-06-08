import { useEffect, useRef } from 'react'
import { drawPattern } from '../lib/textures'

// Aperçu 2D d'une texture procédurale. `tiles` répète le motif (1 / 2 / 4…)
// pour montrer le caractère raccordable de la texture.
export default function TextureSwatch({ pattern, palette, seed = 1, tiles = 1, size = 360, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (tiles <= 1) {
      drawPattern(ctx, pattern, size, palette, seed)
      return
    }
    // Dessine une tuile puis la répète
    const ts = Math.round(size / tiles)
    const tile = document.createElement('canvas')
    tile.width = tile.height = ts
    drawPattern(tile.getContext('2d'), pattern, ts, palette, seed)
    ctx.clearRect(0, 0, size, size)
    for (let y = 0; y < tiles; y++) {
      for (let x = 0; x < tiles; x++) {
        ctx.drawImage(tile, x * ts, y * ts)
      }
    }
  }, [pattern, palette, seed, tiles, size])

  return <canvas ref={ref} className={className} />
}
