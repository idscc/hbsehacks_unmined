/**
 * Renders a large shape (circle, square, triangle, star) as SVG in the given color.
 */
export default function ShapeImage({ shapeId, colorHex, size = 200 }) {
  const s = size
  const h = s / 2
  const fill = colorHex || '#9ca3af'

  if (shapeId === 'circle') {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      </svg>
    )
  }

  if (shapeId === 'square') {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true">
        <rect x="5" y="5" width="90" height="90" fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth="2" rx="4" />
      </svg>
    )
  }

  if (shapeId === 'triangle') {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,8 92,86 8,86" fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      </svg>
    )
  }

  if (shapeId === 'star') {
    // 5-point star
    const cx = 50
    const cy = 50
    const outer = 45
    const inner = 22
    const points = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i * Math.PI) / 5 - Math.PI / 2
      points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    }
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true">
        <polygon points={points.join(' ')} fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      </svg>
    )
  }

  return null
}
