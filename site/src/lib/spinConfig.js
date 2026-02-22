/**
 * Shape odds: 3 shapes at 30% each, 1 shape at 10%.
 */
export const SHAPES = [
  { id: 'circle', name: 'Circle', weight: 30 },
  { id: 'square', name: 'Square', weight: 30 },
  { id: 'triangle', name: 'Triangle', weight: 30 },
  { id: 'star', name: 'Star', weight: 10 },
]

/**
 * Color rarities (percent). Sum = 100.
 */
export const COLORS = [
  { id: 'gray', name: 'Gray', weight: 44.8899, hex: '#9ca3af' },
  { id: 'green', name: 'Green', weight: 30, hex: '#22c55e' },
  { id: 'blue', name: 'Blue', weight: 20, hex: '#3b82f6' },
  { id: 'purple', name: 'Purple', weight: 5, hex: '#a855f7' },
  { id: 'yellow', name: 'Yellow', weight: 0.1, hex: '#eab308' },
  { id: 'pink', name: 'Pink', weight: 0.01, hex: '#ec4899' },
  { id: 'red', name: 'Red', weight: 0.0001, hex: '#ef4444' },
]

/**
 * Pick one item from a weighted list. Weights are in percent (do not need to sum to 100).
 */
export function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

/**
 * Run one spin: independent weighted pick for shape and color.
 */
export function runSpin() {
  const shape = weightedRandom(SHAPES)
  const color = weightedRandom(COLORS)
  return { shape, color }
}
