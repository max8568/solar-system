import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { solarBodies } from './solarSystemData'

const planetColors = {
  mercury: 0x9a8f86,
  venus: 0xd69b54,
  earth: 0x2f80ed,
  mars: 0xc15b32,
  jupiter: 0xd2a06a,
  saturn: 0xd8bd82,
  uranus: 0x75d7d6,
  neptune: 0x2e63d9,
  pluto: 0xa99178,
}

const orbitColors = {
  mercury: 0xb8aaa0,
  venus: 0xf2b866,
  earth: 0x60a5fa,
  mars: 0xf97316,
  jupiter: 0xf6c177,
  saturn: 0xe7d08a,
  uranus: 0x67e8f9,
  neptune: 0x818cf8,
  pluto: 0xfbbf24,
}

function createOrbit(body) {
  const radius = body.orbit
  const points = []
  const segments = 256

  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: orbitColors[body.id],
    transparent: true,
    opacity: body.id === 'pluto' ? 0.72 : 0.46,
  })
  const orbit = new THREE.LineLoop(geometry, material)
  orbit.rotation.x = THREE.MathUtils.degToRad(body.orbitTilt)
  orbit.rotation.y = THREE.MathUtils.degToRad(body.orbitYaw)

  return orbit
}

function createPlanet(body) {
  const radius = Math.max(body.size / 4.8, 1.8)
  const geometry = new THREE.SphereGeometry(radius, 32, 20)
  const material = new THREE.MeshStandardMaterial({
    color: planetColors[body.id],
    roughness: 0.74,
    metalness: 0.04,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = body.id
  mesh.userData.bodyId = body.id

  if (body.hasRing) {
    const ringGeometry = new THREE.RingGeometry(radius * 1.45, radius * 2.15, 64)
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1d79a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2.7
    mesh.add(ring)
  }

  return mesh
}

export function SolarSystemScene({ selectedId, onSelectBody, isPlaying, speed }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ isPlaying, speed, selectedId })

  useEffect(() => {
    stateRef.current = { isPlaying, speed, selectedId }
  }, [isPlaying, speed, selectedId])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07111f)

    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 2200)
    camera.position.set(0, 360, 640)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 180
    controls.maxDistance = 980
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x9fb9d3, 1.15))
    const sunLight = new THREE.PointLight(0xffd27a, 3.5, 1400)
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

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(24, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc83d }),
    )
    sun.name = 'sun'
    sun.userData.bodyId = 'sun'
    scene.add(sun)

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(32, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff8a1d,
        transparent: true,
        opacity: 0.18,
      }),
    )
    scene.add(sunGlow)

    const planetEntries = solarBodies.map((body, index) => {
      const radius = body.orbit
      const orbit = createOrbit(body)
      scene.add(orbit)

      const orbitPlane = new THREE.Object3D()
      orbitPlane.rotation.x = THREE.MathUtils.degToRad(body.orbitTilt)
      orbitPlane.rotation.y = THREE.MathUtils.degToRad(body.orbitYaw)
      scene.add(orbitPlane)

      const runner = new THREE.Object3D()
      runner.rotation.y = index * 0.58
      orbitPlane.add(runner)

      const planet = createPlanet(body)
      planet.position.x = radius
      runner.add(planet)

      return { body, orbit, runner, planet }
    })

    const labelContainer = document.createElement('div')
    labelContainer.className = 'scene-label-layer'
    mount.appendChild(labelContainer)

    const labels = new Map()
    ;[{ id: 'sun', name: '太陽', object: sun, offset: 42 }, ...planetEntries.map(({ body, planet }) => ({
      id: body.id,
      name: body.name,
      object: planet,
      offset: Math.max(body.size / 2 + 5, 14),
    }))].forEach((entry) => {
      const label = document.createElement('button')
      label.type = 'button'
      label.className = 'scene-label'
      label.textContent = entry.name
      label.addEventListener('click', () => onSelectBody(entry.id))
      labelContainer.appendChild(label)
      labels.set(entry.id, { label, object: entry.object, offset: entry.offset })
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      const targets = [sun, ...planetEntries.map(({ planet }) => planet)]
      const intersects = raycaster.intersectObjects(targets, true)
      const selected = intersects.find((item) => item.object.userData.bodyId || item.object.parent?.userData.bodyId)

      if (selected) {
        onSelectBody(selected.object.userData.bodyId ?? selected.object.parent.userData.bodyId)
      }
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)

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

    const updateLabels = () => {
      labels.forEach(({ label, object, offset }, id) => {
        const worldPosition = new THREE.Vector3()
        object.getWorldPosition(worldPosition)
        worldPosition.project(camera)
        const x = (worldPosition.x * 0.5 + 0.5) * mount.clientWidth
        const y = (-worldPosition.y * 0.5 + 0.5) * mount.clientHeight - offset
        label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        label.classList.toggle('selected', stateRef.current.selectedId === id)
        label.hidden = worldPosition.z > 1
      })
    }

    const animate = () => {
      const delta = clock.getDelta()
      const current = stateRef.current

      if (current.isPlaying) {
        sun.rotation.y += delta * 0.28
        sunGlow.rotation.y -= delta * 0.18
        stars.rotation.y += delta * 0.006

        planetEntries.forEach(({ body, runner, planet }) => {
          runner.rotation.y += (delta * current.speed * Math.PI * 2) / body.orbitDuration
          planet.rotation.y += (delta * Math.PI * 2) / body.rotationDuration
        })
      }

      planetEntries.forEach(({ planet, orbit, body }) => {
        const isSelected = current.selectedId === body.id
        planet.scale.setScalar(isSelected ? 1.35 : 1)
        orbit.material.opacity = isSelected ? 0.95 : body.id === 'pluto' ? 0.72 : 0.46
      })
      sun.scale.setScalar(current.selectedId === 'sun' ? 1.2 : 1)

      controls.update()
      updateLabels()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
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
  }, [onSelectBody])

  return <div className="three-scene" ref={mountRef} aria-label="立體太陽系模型" />
}
