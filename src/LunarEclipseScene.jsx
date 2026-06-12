import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createEarthTexture, createGraticule, makeParallel } from './sceneHelpers'

const EARTH_RADIUS = 42
const MOON_RADIUS = 12
const MOON_ORBIT = 170
const SUN_DISTANCE = 700
const SUN_RADIUS = 64
const SHADOW_LENGTH = 250 // umbra reaches past the Moon's orbit

const MOON_BASE_COLOR = new THREE.Color(0xb9b6ad)
const MOON_ECLIPSE_COLOR = new THREE.Color(0x8c2f1d) // copper red of a total lunar eclipse

const text = {
  sun: { zh: '太陽', en: 'Sun' },
  earth: { zh: '地球', en: 'Earth' },
  moon: { zh: '月球', en: 'Moon' },
  shadow: { zh: '地影', en: "Earth's shadow" },
  hudPrefix: { zh: '月球現在：', en: 'The Moon right now: ' },
  nowEclipse: { zh: '月蝕中 🔴', en: 'Lunar eclipse 🔴' },
  nowClear: { zh: '在地影外', en: 'Outside the shadow' },
  earthView: { zh: '從地球看月球', en: 'View from Earth' },
  spaceView: { zh: '太空視角', en: 'Space view' },
}

function getLabel(key, language) {
  return text[key][language === 'en' ? 'en' : 'zh']
}

export function LunarEclipseScene({ isPlaying, speed, language, ariaLabel }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ isPlaying, speed, language })

  useEffect(() => {
    stateRef.current = { isPlaying, speed, language }
  }, [isPlaying, language, speed])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07111f)

    // The canvas is split into two stacked cells, so each camera sees a half-height viewport
    const halfAspect = mount.clientWidth / (mount.clientHeight / 2)
    const camera = new THREE.PerspectiveCamera(48, halfAspect, 0.1, 2600)
    camera.position.set(0, 190, 430)

    // Top cell: looking up at the Moon from a point on Earth's surface
    const earthCam = new THREE.PerspectiveCamera(20, halfAspect, 0.1, 2600)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    // Real shadows so the Earth-view shows the umbra creeping across the Moon's face
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 140
    controls.maxDistance = 1100
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x9fb9d3, 0.8))
    // Parallel sunlight from the Sun's direction, so the Earth and Moon show day/night sides
    const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.4)
    sunLight.position.set(-SUN_DISTANCE, 0, 0)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    sunLight.shadow.camera.left = -230
    sunLight.shadow.camera.right = 230
    sunLight.shadow.camera.top = 230
    sunLight.shadow.camera.bottom = -230
    sunLight.shadow.camera.near = 1
    sunLight.shadow.camera.far = 1600
    sunLight.shadow.bias = -0.0005
    scene.add(sunLight)

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = []
    for (let index = 0; index < 900; index += 1) {
      starPositions.push(
        THREE.MathUtils.randFloatSpread(1800),
        THREE.MathUtils.randFloatSpread(1000),
        THREE.MathUtils.randFloatSpread(1800),
      )
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.72 }),
    )
    scene.add(stars)

    // Sun: a glowing sphere far on the -X side
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 40, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    )
    sun.position.x = -SUN_DISTANCE
    scene.add(sun)

    // Earth at the origin, slowly spinning
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
    earth.castShadow = true
    scene.add(earth)

    // Earth's shadow (umbra): the sunlight is parallel (DirectionalLight), so the umbra is a
    // cylinder behind the Earth — drawn to match exactly what the shadow map casts on the Moon.
    const shadowGeometry = new THREE.CylinderGeometry(EARTH_RADIUS, EARTH_RADIUS, SHADOW_LENGTH, 48, 1, true)
    const shadow = new THREE.Mesh(
      shadowGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    shadow.rotation.z = -Math.PI / 2 // cylinder Y axis → +X (pointing away from the Sun)
    shadow.position.x = SHADOW_LENGTH / 2
    scene.add(shadow)

    // Anchor for the shadow label, above the middle of the cone
    const shadowAnchor = new THREE.Object3D()
    shadowAnchor.position.set(SHADOW_LENGTH * 0.55, EARTH_RADIUS * 0.9, 0)
    scene.add(shadowAnchor)

    // Moon orbit ring + the Moon on a runner (orbit kept in the Sun–Earth plane so an
    // eclipse happens every revolution — simplified on purpose for teaching)
    const moonOrbit = makeParallel(
      0,
      MOON_ORBIT,
      new THREE.LineBasicMaterial({ color: 0x8ba3c7, transparent: true, opacity: 0.5 }),
    )
    scene.add(moonOrbit)

    const moonRunner = new THREE.Object3D()
    scene.add(moonRunner)
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: MOON_BASE_COLOR.clone(),
      roughness: 0.92,
      metalness: 0.02,
    })
    const moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_RADIUS, 32, 20), moonMaterial)
    moon.receiveShadow = true
    moon.position.x = MOON_ORBIT
    moon.add(createGraticule(MOON_RADIUS))
    moonRunner.add(moon)
    // Start just before the shadow (which sits at +X, rotation 0/2π) so the eclipse shows up quickly
    moonRunner.rotation.y = Math.PI * 1.85

    // HTML label layer (same pattern/classes as EarthMoonScene)
    const labelContainer = document.createElement('div')
    labelContainer.className = 'scene-label-layer'
    mount.appendChild(labelContainer)

    const hud = document.createElement('div')
    hud.className = 'tide-hud'
    mount.appendChild(hud)

    // Divider and captions for the two stacked viewports
    const divider = document.createElement('div')
    divider.className = 'viewport-divider'
    mount.appendChild(divider)
    const topCaption = document.createElement('div')
    topCaption.className = 'viewport-caption top'
    mount.appendChild(topCaption)
    const bottomCaption = document.createElement('div')
    bottomCaption.className = 'viewport-caption bottom'
    mount.appendChild(bottomCaption)

    const labelEntries = [
      // The Sun is far from the camera, so its on-screen radius is much smaller than SUN_RADIUS
      { key: 'sun', object: sun, offset: 30 },
      { key: 'earth', object: earth, offset: EARTH_RADIUS + 18 },
      { key: 'moon', object: moon, offset: MOON_RADIUS + 18 },
      { key: 'shadow', object: shadowAnchor, offset: 8 },
    ].map((entry) => {
      const label = document.createElement('span')
      label.className = 'scene-label'
      labelContainer.appendChild(label)
      return { ...entry, label }
    })

    const resizeObserver = new ResizeObserver(() => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      camera.aspect = width / (height / 2)
      camera.updateProjectionMatrix()
      earthCam.aspect = width / (height / 2)
      earthCam.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    resizeObserver.observe(mount)

    const clock = new THREE.Clock()
    let animationId = 0
    const moonWorldPos = new THREE.Vector3()
    const worldPosition = new THREE.Vector3()
    const earthCamPos = new THREE.Vector3()

    // The Moon is eclipsed when it sits inside the umbra cylinder behind the Earth —
    // the same boundary the shadow map produces, so both viewports stay in sync.
    const isMoonInShadow = () => {
      if (moonWorldPos.x <= 0) return false
      return Math.hypot(moonWorldPos.y, moonWorldPos.z) < EARTH_RADIUS
    }

    // Orbital speed scales with the Moon's angular distance from the shadow axis:
    // slowest while crossing the umbra, smoothly ramping up to ECLIPSE_FAST on the far
    // side, so the wait between eclipses stays short but the eclipse is easy to watch.
    const ECLIPSE_SLOW = 0.2
    const ECLIPSE_FAST = 3
    const SLOW_ZONE_ANGLE = 0.35 // rad — a little wider than the umbra crossing itself
    let eclipseSlowdown = 1

    const updateHud = (eclipsed) => {
      const { language: lang } = stateRef.current
      hud.textContent = getLabel('hudPrefix', lang) + getLabel(eclipsed ? 'nowEclipse' : 'nowClear', lang)
      hud.classList.toggle('eclipse', eclipsed)
    }

    const updateLabels = () => {
      const { language: lang } = stateRef.current
      topCaption.textContent = getLabel('earthView', lang)
      bottomCaption.textContent = getLabel('spaceView', lang)
      const halfHeight = mount.clientHeight / 2
      labelEntries.forEach(({ label, object, offset, key }) => {
        object.getWorldPosition(worldPosition)
        label.textContent = getLabel(key, lang)
        worldPosition.project(camera)
        // The space view lives in the bottom cell, so map its labels into that half
        const x = (worldPosition.x * 0.5 + 0.5) * mount.clientWidth
        const y = (-worldPosition.y * 0.5 + 0.5) * halfHeight + halfHeight - offset
        label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        // Labels belong to the bottom cell only — hide any that would cross into the top cell
        label.hidden =
          worldPosition.z > 1 ||
          y < halfHeight + 22 ||
          y > mount.clientHeight ||
          x < 0 ||
          x > mount.clientWidth
      })
    }

    const animate = () => {
      const delta = clock.getDelta()
      const current = stateRef.current

      if (current.isPlaying) {
        earth.rotation.y += (delta * current.speed * Math.PI * 2) / 20
        moonRunner.rotation.y += ((delta * current.speed * Math.PI * 2) / 12) * eclipseSlowdown
        stars.rotation.y += delta * 0.006
      }

      moon.getWorldPosition(moonWorldPos)
      const eclipsed = isMoonInShadow()
      // 0 rad = centred in the shadow, π = far side of the orbit
      const angleFromShadow = Math.acos(THREE.MathUtils.clamp(moonWorldPos.x / MOON_ORBIT, -1, 1))
      eclipseSlowdown =
        ECLIPSE_SLOW +
        (ECLIPSE_FAST - ECLIPSE_SLOW) * THREE.MathUtils.smoothstep(angleFromShadow, SLOW_ZONE_ANGLE, Math.PI)
      // Ease the Moon toward copper red inside the umbra, back to grey outside
      moonMaterial.color.lerp(eclipsed ? MOON_ECLIPSE_COLOR : MOON_BASE_COLOR, Math.min(1, delta * 4))

      // Keep the Earth-surface camera under the Moon, looking straight up at it
      earthCamPos.copy(moonWorldPos).normalize().multiplyScalar(EARTH_RADIUS + 8)
      earthCam.position.copy(earthCamPos)
      earthCam.lookAt(moonWorldPos)

      controls.update()
      updateHud(eclipsed)
      updateLabels()

      const width = mount.clientWidth
      const height = mount.clientHeight
      const half = Math.floor(height / 2)
      renderer.setScissorTest(true)

      // Bottom cell: the space view (orbit camera)
      renderer.setViewport(0, 0, width, half)
      renderer.setScissor(0, 0, width, half)
      renderer.render(scene, camera)

      // Top cell: the view from Earth — hide helpers that would block the line of sight
      shadow.visible = false
      moonOrbit.visible = false
      renderer.setViewport(0, half, width, height - half)
      renderer.setScissor(0, half, width, height - half)
      renderer.render(scene, earthCam)
      shadow.visible = true
      moonOrbit.visible = true

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
