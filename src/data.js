// Categories shown in the filter bar
export const categories = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'characters', label: 'Characters', icon: '🦸' },
  { id: 'props', label: 'Props', icon: '📦' },
  { id: 'collectibles', label: 'Collectibles', icon: '💎' },
  { id: 'weapons', label: 'Weapons', icon: '⚔️' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { id: 'nature', label: 'Nature', icon: '🌲' },
  { id: 'scifi', label: 'Sci-Fi', icon: '🛸' },
  { id: 'materials', label: 'Materials', icon: '🎨' },
  { id: 'ui', label: 'UI / Proto', icon: '✦' },
]

// Representative emoji per model kind (used for the idle "studio" preview)
export const KIND_EMOJI = {
  crate: '📦',
  barrel: '🛢️',
  coin: '🪙',
  gem: '💎',
  chest: '🧰',
  sword: '⚔️',
  shield: '🛡️',
  rocket: '🚀',
  tree: '🌲',
  rock: '🪨',
  planet: '🪐',
  drone: '🛸',
  character: '🦸',
  key: '🗝️',
  potion: '🧪',
  car: '🚗',
}

export const MODEL_KINDS = Object.keys(KIND_EMOJI)
export const MODEL_FORMATS = ['FBX', 'GLTF', 'OBJ', 'USDZ']
export const TEX_FORMATS = ['PNG', 'JPG', 'EXR', 'PBR']

let _id = 0
const model = (o) => ({
  id: ++_id,
  type: 'model',
  formats: MODEL_FORMATS,
  size: (1 + (o.poly % 40) / 10).toFixed(1) + ' MB',
  ...o,
})
const texture = (o) => ({
  id: ++_id,
  type: 'texture',
  formats: TEX_FORMATS,
  res: o.res ?? '2K',
  size: (4 + (_id % 9)).toFixed(1) + ' MB',
  ...o,
})

export const assets = [
  // ---------- 3D MODELS ----------
  model({ name: 'Wooden Crate', kind: 'crate', cats: ['props'], palette: { base: '#b5803f', accent: '#5f3f1e' }, poly: 312 }),
  model({ name: 'Steel Barrel', kind: 'barrel', cats: ['props'], palette: { base: '#8a5a2b', accent: '#cfa14a' }, poly: 540 }),
  model({ name: 'Gold Coin', kind: 'coin', cats: ['collectibles', 'ui'], palette: { base: '#ffcb3d', accent: '#e69a00' }, poly: 220 }),
  model({ name: 'Emerald Gem', kind: 'gem', cats: ['collectibles'], palette: { base: '#2bd96b', accent: '#9bffc4' }, poly: 96 }),
  model({ name: 'Ruby Crystal', kind: 'gem', cats: ['collectibles'], palette: { base: '#ff3b6b', accent: '#ff9db6' }, poly: 96 }),
  model({ name: 'Treasure Chest', kind: 'chest', cats: ['props', 'collectibles'], palette: { base: '#9a5b2a', accent: '#ffcb3d' }, poly: 880 }),
  model({ name: 'Hero Sword', kind: 'sword', cats: ['weapons'], palette: { base: '#6b4a23', accent: '#cdd6df' }, poly: 410 }),
  model({ name: 'Round Shield', kind: 'shield', cats: ['weapons'], palette: { base: '#c33b3b', accent: '#ffcf57' }, poly: 360 }),
  model({ name: 'Cartoon Rocket', kind: 'rocket', cats: ['vehicles', 'scifi'], palette: { base: '#eef2f7', accent: '#ff5e57' }, poly: 760 }),
  model({ name: 'Lowpoly Pine', kind: 'tree', cats: ['nature'], palette: { base: '#2e9e5b', accent: '#7a5230' }, poly: 280 }),
  model({ name: 'Eroded Rock', kind: 'rock', cats: ['nature'], palette: { base: '#8b8f98', accent: '#5f636b' }, poly: 120 }),
  model({ name: 'Ringed Planet', kind: 'planet', cats: ['scifi'], palette: { base: '#6d5efc', accent: '#ffb347' }, poly: 1024 }),
  model({ name: 'Combat Drone', kind: 'drone', cats: ['scifi', 'vehicles'], palette: { base: '#2b2f3a', accent: '#22d3ee' }, poly: 1340 }),
  model({ name: 'Blob Mascot', kind: 'character', cats: ['characters'], palette: { base: '#6d5efc', accent: '#ffd166' }, poly: 1580 }),
  model({ name: 'Robot Buddy', kind: 'character', cats: ['characters', 'scifi'], palette: { base: '#b8c2cc', accent: '#ff5e57' }, poly: 1620 }),
  model({ name: 'Golden Key', kind: 'key', cats: ['props', 'collectibles'], palette: { base: '#ffcb3d', accent: '#e69a00' }, poly: 180 }),
  model({ name: 'Health Potion', kind: 'potion', cats: ['collectibles'], palette: { base: '#ff3b6b', accent: '#ff9db6' }, poly: 520 }),
  model({ name: 'Lowpoly Racer', kind: 'car', cats: ['vehicles'], palette: { base: '#2f6bff', accent: '#1c1f26' }, poly: 640 }),

  // ---------- TEXTURES ----------
  texture({ name: 'Brick Wall', pattern: 'bricks', cats: ['materials'], palette: { base: '#b1503c', accent: '#d8cbb6' }, res: '2K' }),
  texture({ name: 'Wood Planks', pattern: 'wood', cats: ['materials', 'nature'], palette: { base: '#a9743f', accent: '#6b4a23' }, res: '4K' }),
  texture({ name: 'Brushed Metal', pattern: 'metal', cats: ['materials', 'scifi'], palette: { base: '#9aa3ad', accent: '#c7ced6' }, res: '2K' }),
  texture({ name: 'Proto Checker', pattern: 'checker', cats: ['ui', 'materials'], palette: { base: '#e74c6b', accent: '#ffffff' }, res: '1K' }),
  texture({ name: 'Sci-Fi Grid', pattern: 'grid', cats: ['scifi', 'ui'], palette: { base: '#0c1230', accent: '#22d3ee' }, res: '2K' }),
  texture({ name: 'Hexagons', pattern: 'hexagons', cats: ['ui', 'materials'], palette: { base: '#6d5efc', accent: '#c4bdff' }, res: '2K' }),
  texture({ name: 'Circuit Board', pattern: 'circuit', cats: ['scifi'], palette: { base: '#07140f', accent: '#43f59b' }, res: '2K' }),
  texture({ name: 'Molten Lava', pattern: 'lava', cats: ['materials'], palette: { base: '#1a0d08', accent: '#ff6a00' }, res: '4K' }),
  texture({ name: 'Woven Fabric', pattern: 'fabric', cats: ['materials'], palette: { base: '#3b6ea5', accent: '#2a4f78' }, res: '2K' }),
  texture({ name: 'Stone Pavers', pattern: 'stone', cats: ['materials', 'nature'], palette: { base: '#8b8f98', accent: '#5f636b' }, res: '2K' }),
  texture({ name: 'Retro Dots', pattern: 'dots', cats: ['ui'], palette: { base: '#ffd166', accent: '#ef476f' }, res: '1K' }),
  texture({ name: 'Desert Sand', pattern: 'sand', cats: ['nature', 'materials'], palette: { base: '#d8b773', accent: '#b9925a' }, res: '2K' }),
]
