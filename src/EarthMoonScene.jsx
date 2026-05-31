import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const EARTH_RADIUS = 42
const OCEAN_RADIUS = EARTH_RADIUS * 1.2 // mean sea level, comfortably enclosing the Earth
const TIDE_AMPLITUDE = 0.18 // how strongly the water is pulled toward/away from the Moon
const MOON_RADIUS = 12
const MOON_ORBIT = 170

const text = {
  earth: { zh: '地球', en: 'Earth' },
  moon: { zh: '月球', en: 'Moon' },
  highTide: { zh: '高潮', en: 'High tide' },
  lowTide: { zh: '低潮', en: 'Low tide' },
  observer: { zh: '觀測點', en: 'Marked spot' },
  hudPrefix: { zh: '這個地點現在：', en: 'This spot right now: ' },
  nowHigh: { zh: '漲潮（高潮）🌊', en: 'High tide 🌊' },
  nowLow: { zh: '退潮（低潮）', en: 'Low tide' },
}

function getLabel(key, language) {
  return text[key][language === 'en' ? 'en' : 'zh']
}

// A horizontal circle (parallel) at a given latitude, in the XZ plane.
function makeParallel(latDeg, radius, material) {
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
function createGraticule(bodyRadius, options = {}) {
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

function createEarthTexture() {
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

export function EarthMoonScene({ isPlaying, speed, earthSpin, language, ariaLabel }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ isPlaying, speed, earthSpin, language })

  useEffect(() => {
    stateRef.current = { isPlaying, speed, earthSpin, language }
  }, [isPlaying, language, speed, earthSpin])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07111f)

    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 2200)
    camera.position.set(0, 150, 360)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 120
    controls.maxDistance = 700
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x9fb9d3, 1.05))
    const sunLight = new THREE.PointLight(0xffd27a, 3.2, 1600)
    sunLight.position.set(-320, 160, 220)
    scene.add(sunLight)

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = []
    for (let index = 0; index < 900; index += 1) {
      starPositions.push(
        THREE.MathUtils.randFloatSpread(1500),
        THREE.MathUtils.randFloatSpread(900),
        THREE.MathUtils.randFloatSpread(1500),
      )
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.72 }),
    )
    scene.add(stars)

    // Earth (tilted ~23.5°, spins on its axis)
    const earthPivot = new THREE.Object3D()
    earthPivot.rotation.z = THREE.MathUtils.degToRad(23.5)
    scene.add(earthPivot)

    const earthTexture = createEarthTexture()
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 48, 32),
      new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.74, metalness: 0.04 }),
    )
    earth.add(
      createGraticule(EARTH_RADIUS, {
        gridColor: 0xdbeafe,
        gridOpacity: 0.5,
        equatorColor: 0xfbbf24,
      }),
    )
    earthPivot.add(earth)

    // Tide frame: holds the tide labels' anchors, re-aimed at the Moon each frame
    const tideFrame = new THREE.Object3D()
    scene.add(tideFrame)

    // --- Tidal ocean -----------------------------------------------------------------
    // A water sphere pulled outward toward (and opposite) the Moon. The coloured meridians
    // stay FIXED in space; every frame each vertex is pushed along its radius by the tidal
    // factor, so the meridian the Moon is over rises (high tide) and sinks as it moves on.

    const oceanGroup = new THREE.Object3D() // fixed orientation (follows neither Moon nor Earth)
    scene.add(oceanGroup)

    // Deformable translucent surface with a simple solid colour so the tide shape is easier to read.
    const oceanGeometry = new THREE.SphereGeometry(OCEAN_RADIUS, 64, 40)
    const oceanRest = Float32Array.from(oceanGeometry.attributes.position.array)
    const ocean = new THREE.Mesh(
      oceanGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    )
    oceanGroup.add(ocean)

    // Tide label anchors (children of tideFrame so they follow the Moon direction)
    const makeAnchor = (key, x, y, z) => {
      const anchor = new THREE.Object3D()
      anchor.position.set(x, y, z)
      anchor.userData.tideKey = key
      tideFrame.add(anchor)
      return anchor
    }
    const bulgeReach = OCEAN_RADIUS * (1 + TIDE_AMPLITUDE) + 4
    const tideAnchors = [
      makeAnchor('highTide', 0, 0, bulgeReach), // bulge toward the Moon
      makeAnchor('highTide', 0, 0, -bulgeReach), // bulge away from the Moon
    ]

    // Moon's orbital path (a circle in the XZ plane, same plane the runner sweeps)
    const moonOrbit = makeParallel(
      0,
      MOON_ORBIT,
      new THREE.LineBasicMaterial({ color: 0x8ba3c7, transparent: true, opacity: 0.5 }),
    )
    scene.add(moonOrbit)

    // Moon: a runner spins it around the Earth; the moon mesh also rotates
    const moonRunner = new THREE.Object3D()
    scene.add(moonRunner)
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 32, 20),
      new THREE.MeshStandardMaterial({ color: 0xb9b6ad, roughness: 0.92, metalness: 0.02 }),
    )
    moon.position.x = MOON_ORBIT
    moon.add(createGraticule(MOON_RADIUS)) // lat/long grid + equator, spins with the Moon
    moonRunner.add(moon)

    // Observer: a bright marker on the equator that rides Earth's spin (demonstrates 2 tides/day)
    const observer = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xff5252 }),
    )
    observer.position.set(EARTH_RADIUS * 1.02, 0, 0)
    earth.add(observer)

    // HTML label layer (same pattern/classes as SolarSystemScene)
    const labelContainer = document.createElement('div')
    labelContainer.className = 'scene-label-layer'
    mount.appendChild(labelContainer)

    // Top-center HUD showing the marked spot's live tide state
    const hud = document.createElement('div')
    hud.className = 'tide-hud'
    mount.appendChild(hud)

    const labelEntries = [
      { key: 'earth', object: earth, offset: EARTH_RADIUS + 6, occlude: false },
      { key: 'moon', object: moon, offset: MOON_RADIUS + 6, occlude: true },
      { key: 'observer', object: observer, offset: 10, variant: 'observer', occlude: true },
      ...tideAnchors.map((object) => ({
        key: object.userData.tideKey,
        object,
        offset: 8,
        variant: 'high',
        occlude: true,
      })),
    ].map((entry) => {
      const label = document.createElement('span')
      label.className = entry.variant ? `scene-label tide-callout ${entry.variant}` : 'scene-label'
      labelContainer.appendChild(label)
      return { ...entry, label }
    })

    const resizeObserver = new ResizeObserver(() => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    resizeObserver.observe(mount)

    const clock = new THREE.Clock()
    let animationId = 0
    const moonWorldPos = new THREE.Vector3()
    const worldPosition = new THREE.Vector3()
    const earthCenter = new THREE.Vector3()
    const observerPos = new THREE.Vector3()
    const observerDir = new THREE.Vector3()
    const moonDir = new THREE.Vector3()
    const camPos = new THREE.Vector3()
    const occToCenter = new THREE.Vector3()
    const occRayDir = new THREE.Vector3()

    // True if the Earth sphere sits between the camera and the world-space point P.
    const isOccludedByEarth = (point) => {
      camera.getWorldPosition(camPos)
      occToCenter.subVectors(earthCenter, camPos)
      occRayDir.subVectors(point, camPos)
      const dist = occRayDir.length()
      if (dist === 0) return false
      occRayDir.divideScalar(dist)
      const t = occToCenter.dot(occRayDir) // distance to closest approach to Earth center
      if (t <= 0) return false // Earth is behind the point's direction
      const d2 = occToCenter.lengthSq() - t * t // squared miss distance from Earth center
      const r2 = EARTH_RADIUS * EARTH_RADIUS
      if (d2 > r2) return false // ray misses the Earth
      const tHit = t - Math.sqrt(r2 - d2) // first intersection with the Earth
      return tHit > 0 && tHit < dist - 0.5 // Earth is hit before reaching the point
    }

    const updateHud = () => {
      const { language: lang } = stateRef.current
      earth.getWorldPosition(earthCenter)
      observer.getWorldPosition(observerPos)
      observerDir.subVectors(observerPos, earthCenter).normalize()
      moonDir.subVectors(moonWorldPos, earthCenter).normalize()
      // Near a bulge (aligned with or opposite the Moon) → high tide; perpendicular → low tide
      const isHigh = Math.abs(observerDir.dot(moonDir)) > Math.cos(THREE.MathUtils.degToRad(45))
      hud.textContent = getLabel('hudPrefix', lang) + getLabel(isHigh ? 'nowHigh' : 'nowLow', lang)
      hud.classList.toggle('high', isHigh)
      hud.classList.toggle('low', !isHigh)
    }

    // Push every vertex out along its radius by the tidal factor, based on the Moon direction.
    // Bulges where |cos θ| is large (toward/away from Moon), troughs where it's ~0.
    const minRadius = EARTH_RADIUS * 1.02 // water recedes to the shoreline, never inside the Earth
    const deformTide = (geometry, rest) => {
      const posArr = geometry.attributes.position.array
      const mx = moonDir.x
      const my = moonDir.y
      const mz = moonDir.z
      for (let i = 0; i < posArr.length; i += 3) {
        const rx = rest[i]
        const ry = rest[i + 1]
        const rz = rest[i + 2]
        const len = Math.hypot(rx, ry, rz) || 1
        const cos = (rx * mx + ry * my + rz * mz) / len
        const f = 1 + (TIDE_AMPLITUDE * (3 * cos * cos - 1)) / 2
        const scale = Math.max(len * f, minRadius) / len
        posArr[i] = rx * scale
        posArr[i + 1] = ry * scale
        posArr[i + 2] = rz * scale
      }
      geometry.attributes.position.needsUpdate = true
    }

    const updateOcean = () => {
      earth.getWorldPosition(earthCenter)
      moonDir.subVectors(moonWorldPos, earthCenter).normalize()
      deformTide(oceanGeometry, oceanRest)
    }

    const updateLabels = () => {
      const { language: lang } = stateRef.current
      earth.getWorldPosition(earthCenter)
      labelEntries.forEach(({ label, object, offset, key, occlude }) => {
        object.getWorldPosition(worldPosition)
        label.textContent = getLabel(key, lang)
        const hidden = occlude && isOccludedByEarth(worldPosition)
        worldPosition.project(camera)
        const x = (worldPosition.x * 0.5 + 0.5) * mount.clientWidth
        const y = (-worldPosition.y * 0.5 + 0.5) * mount.clientHeight - offset
        label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        label.hidden = hidden || worldPosition.z > 1
      })
    }

    const animate = () => {
      const delta = clock.getDelta()
      const current = stateRef.current

      if (current.isPlaying) {
        // Earth's spin is opt-in (off by default) and follows the speed control (~14s/turn at normal)
        if (current.earthSpin) {
          earth.rotation.y += (delta * current.speed * Math.PI * 2) / 5
        }
        // Tidal locking: the Moon is parented to the runner, so orbiting alone
        // already keeps the same face toward Earth — no separate spin needed.
        moonRunner.rotation.y += (delta * current.speed * Math.PI * 2) / 12
        stars.rotation.y += delta * 0.006
      }

      // Keep the tide labels aimed at the Moon, and pull the water toward it
      moon.getWorldPosition(moonWorldPos)
      tideFrame.lookAt(moonWorldPos)

      controls.update()
      updateOcean()
      updateHud()
      updateLabels()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      mount.replaceChildren()
      scene.traverse((object) => {
        object.geometry?.dispose?.()
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose())
        } else {
          object.material?.dispose?.()
        }
      })
    }
  }, [])

  return <div className="three-scene" ref={mountRef} aria-label={ariaLabel} />
}
