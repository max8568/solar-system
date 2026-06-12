import * as THREE from 'three'

// A horizontal circle (parallel) at a given latitude, in the XZ plane.
export function makeParallel(latDeg, radius, material) {
  const lat = THREE.MathUtils.degToRad(latDeg)
  const ringRadius = Math.cos(lat) * radius
  const y = Math.sin(lat) * radius
  const points = []
  const segments = 128
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.LineLoop(geometry, material)
}

// A meridian (great circle through the poles) in the XY plane; caller rotates it around Y.
function makeMeridian(radius, material) {
  const points = []
  const segments = 128
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.LineLoop(geometry, material)
}

// Latitude/longitude grid, optionally with a highlighted equator, sitting just above the surface.
export function createGraticule(bodyRadius, options = {}) {
  const {
    gridColor = 0x9fd0ff,
    gridOpacity = 0.35,
    equatorColor = 0xfbbf24,
    parallels = true,
    meridians = true,
    meridianColors = null,
  } = options
  const radius = bodyRadius * 1.003
  const group = new THREE.Group()

  const gridMaterial = new THREE.LineBasicMaterial({
    color: gridColor,
    transparent: true,
    opacity: gridOpacity,
  })
  const equatorMaterial =
    equatorColor == null
      ? gridMaterial
      : new THREE.LineBasicMaterial({ color: equatorColor, transparent: true, opacity: 0.85 })

  if (parallels) {
    for (const lat of [-60, -30, 0, 30, 60]) {
      group.add(makeParallel(lat, radius, lat === 0 ? equatorMaterial : gridMaterial))
    }
  }

  if (meridians) {
    let index = 0
    for (let lonDeg = 0; lonDeg < 180; lonDeg += 30) {
      // Optionally give each meridian its own color (same opacity as the grid)
      const material = meridianColors
        ? new THREE.LineBasicMaterial({
            color: meridianColors[index % meridianColors.length],
            transparent: true,
            opacity: gridOpacity,
          })
        : gridMaterial
      const meridian = makeMeridian(radius, material)
      meridian.rotation.y = THREE.MathUtils.degToRad(lonDeg)
      group.add(meridian)
      index += 1
    }
  }

  return group
}

export function createEarthTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#2563eb'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const drawLand = (points) => {
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      const px = (x / 100) * canvas.width
      const py = (y / 100) * canvas.height
      if (index === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  ctx.fillStyle = '#22c55e'
  ctx.strokeStyle = 'rgba(240, 253, 244, 0.55)'
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'

  // Simplified continent shapes for recognition, not geographic precision.
  drawLand([
    [13, 22],
    [20, 15],
    [29, 18],
    [33, 28],
    [30, 38],
    [23, 43],
    [17, 38],
    [11, 30],
  ])
  drawLand([
    [28, 43],
    [34, 48],
    [38, 59],
    [36, 75],
    [31, 86],
    [27, 72],
    [24, 57],
  ])
  drawLand([
    [45, 21],
    [55, 17],
    [67, 21],
    [75, 31],
    [70, 41],
    [58, 40],
    [49, 34],
  ])
  drawLand([
    [52, 40],
    [61, 41],
    [65, 54],
    [61, 72],
    [54, 74],
    [48, 59],
    [48, 47],
  ])
  drawLand([
    [66, 33],
    [79, 27],
    [91, 33],
    [94, 44],
    [86, 52],
    [75, 48],
    [68, 42],
  ])
  drawLand([
    [80, 66],
    [88, 63],
    [95, 69],
    [93, 78],
    [84, 80],
    [78, 73],
  ])
  drawLand([
    [40, 82],
    [55, 79],
    [72, 82],
    [86, 88],
    [75, 94],
    [55, 93],
    [37, 89],
  ])

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = 4
  return texture
}
