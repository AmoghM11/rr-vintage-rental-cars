// The spotlit showroom: one fixed WebGL canvas behind the page.
// The page feeds it scroll state; it decides which car is on the turntable,
// where the camera is, and how bright the stage lights are.
import { THREE } from './kit.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { buildCar, CAR_IDS } from './cars.js'
import { loadCar, PHOTO_CARS } from './models.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a, b, t) => a + (b - a) * t

function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xffe2b8) }, uOpacity: { value: 0 }, uHeight: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uHeight; varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){
        vH = position.y / uHeight + 0.5;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){
        float edge = pow(abs(dot(vN, vV)), 2.2);
        float fall = pow(vH, 1.3);
        gl_FragColor = vec4(uColor, uOpacity * edge * fall * 0.42);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

export function createStage(canvas) {
  const isMobile = window.matchMedia('(max-width: 820px)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const BG = 0x060504
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BG)
  scene.fog = new THREE.Fog(BG, 13, 30)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.32

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120)

  /* ---------- floor + turntable ---------- */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 72),
    new THREE.MeshStandardMaterial({ color: 0x0a0908, roughness: 0.62, metalness: 0, envMapIntensity: 0.02 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const spinner = new THREE.Group()
  scene.add(spinner)
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x15120f, roughness: 0.32, metalness: 0.75 })
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.118, 120), tableMat)
  base.position.y = 0.059
  base.receiveShadow = true
  spinner.add(base)
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x8e6b36, emissive: 0xb08850, emissiveIntensity: 0.3, metalness: 1, roughness: 0.3 })
  for (const [r, t, y] of [
    [3.3, 0.016, 0.119],
    [3.4, 0.012, 0.01],
    [2.55, 0.006, 0.121],
    [1.4, 0.005, 0.121],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 160), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = y
    spinner.add(ring)
  }
  // tick marks so the rotation reads
  const tickGeo = new THREE.BoxGeometry(0.18, 0.004, 0.012)
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const t = new THREE.Mesh(tickGeo, ringMat)
    t.position.set(Math.cos(a) * 3.12, 0.122, Math.sin(a) * 3.12)
    t.rotation.y = -a
    spinner.add(t)
  }
  let mirror = null
  if (!isMobile) {
    mirror = new Reflector(new THREE.CircleGeometry(3.29, 96), {
      clipBias: 0.003,
      textureWidth: Math.round(window.innerWidth * 0.6),
      textureHeight: Math.round(window.innerHeight * 0.6),
      color: 0x2c2a28,
    })
    mirror.rotation.x = -Math.PI / 2
    mirror.position.y = 0.12
    spinner.add(mirror)
  } else {
    const top = new THREE.Mesh(
      new THREE.CircleGeometry(3.29, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x0b0a09, roughness: 0.18, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 }),
    )
    top.rotation.x = -Math.PI / 2
    top.position.y = 0.12
    top.receiveShadow = true
    spinner.add(top)
  }

  /* ---------- cars ---------- */
  const cars = CAR_IDS.map(() => null)
  function mount(i, c) {
    c.position.y = 0.12
    c.visible = false
    if (!c.userData.reveal) c.userData.reveal = { value: 1 }
    spinner.add(c)
    cars[i] = c
  }
  async function load(onProgress) {
    const prog = CAR_IDS.map(() => 0)
    const report = () => onProgress?.(prog.reduce((a, b) => a + b, 0) / prog.length)
    await Promise.all(
      CAR_IDS.map(async (id, i) => {
        let c
        if (PHOTO_CARS.includes(id)) {
          try {
            c = await loadCar(id, `/models/${id}.glb`, (p) => {
              prog[i] = p
              report()
            })
          } catch (e) {
            console.warn(`[stage] photo model for ${id} unavailable, using the hand-built car`, e?.message)
          }
        }
        if (!c) c = buildCar(id)
        prog[i] = 1
        report()
        mount(i, c)
      }),
    )
    // compile every program up front so the first reveal doesn't stutter
    cars.forEach((c) => (c.visible = true))
    renderer.compile(scene, camera)
    cars.forEach((c) => (c.visible = false))
    lastCar = -1
  }

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xcdb89a, 0x070504, 0.2)
  scene.add(hemi)
  const target = new THREE.Object3D()
  target.position.set(0, 0.6, 0)
  scene.add(target)

  const fixtures = [
    { pos: new THREE.Vector3(-5.2, 9.5, 4.2), color: 0xffe2b8, power: 950, shadow: true },
    { pos: new THREE.Vector3(5.6, 9.5, 3.4), color: 0xfff0d8, power: 700, shadow: !isMobile },
    { pos: new THREE.Vector3(0.5, 8, -7.5), color: 0xa9bad6, power: 420, shadow: false, noBeam: true },
  ]
  const fixtureGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.6, 24)
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.8 })
  const faceMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6 })
  const spots = []
  const beams = []
  for (const f of fixtures) {
    const s = new THREE.SpotLight(f.color, 0, 0, f.noBeam ? 0.55 : 0.36, 0.6, 2)
    s.position.copy(f.pos)
    s.target = target
    if (f.shadow) {
      s.castShadow = true
      s.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048)
      s.shadow.bias = -0.0004
      s.shadow.normalBias = 0.02
      s.shadow.radius = 5
      s.shadow.camera.near = 5
      s.shadow.camera.far = 22
    }
    s.userData.power = f.power
    scene.add(s)
    spots.push(s)
    if (f.noBeam) continue
    const dir = target.position.clone().sub(f.pos)
    const L = dir.length() * 1.08
    const geo = new THREE.ConeGeometry(L * Math.tan(0.36) * 1.05, L, 64, 1, true)
    const mat = beamMaterial()
    mat.uniforms.uHeight.value = L
    const cone = new THREE.Mesh(geo, mat)
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate().normalize())
    cone.position.copy(f.pos).add(dir.clone().normalize().multiplyScalar(L / 2))
    cone.renderOrder = 10
    scene.add(cone)
    beams.push(mat)
    // the lamp housing itself
    const fx = new THREE.Group()
    const can = new THREE.Mesh(fixtureGeo, fixtureMat)
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), faceMat)
    face.rotation.x = Math.PI / 2
    face.position.y = -0.301
    fx.add(can, face)
    fx.position.copy(f.pos)
    fx.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize())
    scene.add(fx)
  }

  // dust motes drifting in the beams
  const DUST = isMobile ? 220 : 520
  const dustPos = new Float32Array(DUST * 3)
  const dustSeed = new Float32Array(DUST)
  for (let i = 0; i < DUST; i++) {
    const f = fixtures[i % 2].pos
    const k = Math.random()
    const spread = 0.2 + k * 2.2
    dustPos[i * 3] = lerp(f.x, 0, k) + (Math.random() - 0.5) * spread
    dustPos[i * 3 + 1] = lerp(f.y, 0.6, k) + (Math.random() - 0.5) * spread
    dustPos[i * 3 + 2] = lerp(f.z, 0, k) + (Math.random() - 0.5) * spread
    dustSeed[i] = Math.random() * 100
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dustBase = dustPos.slice()
  const dustMat = new THREE.PointsMaterial({
    color: 0xe6cf9f,
    size: 0.022,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(dustGeo, dustMat))

  // headlights follow whichever car is active
  const heads = [0, 1].map(() => {
    const h = new THREE.SpotLight(0xffe2b0, 0, 16, 0.42, 0.55, 1.6)
    h.target = new THREE.Object3D()
    return h
  })
  let headCar = null
  function attachHeads(car) {
    if (headCar === car) return
    headCar = car
    const pts = car.userData.lampPoints
    heads.forEach((h, i) => {
      const p = pts[i % pts.length]
      car.add(h)
      car.add(h.target)
      h.position.copy(p)
      h.target.position.set(p.x + 6, 0, p.z * 1.6)
    })
  }

  /* ---------- state ---------- */
  const state = {
    mode: 'hero',
    heroP: 0,
    T: 0,
    active: false,
    introAt: -1,
    hotspotEls: [],
    // smoothed rig values
    az: 0.95,
    h: 1.4,
    dist: 9,
    lookY: 0.75,
    sx: 0,
    sy: 0.08,
    lights: 0,
    head: 0,
  }
  let lastCar = -1
  let prevX = new Map()
  let raf = 0
  let lastT = performance.now()
  let W = 0
  let H = 0

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    if (w === W && Math.abs(h - H) < 120 && isMobile) return
    W = w
    H = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.9 ? 40 : 30
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const portrait = () => W / H < 0.9
  // distance that fits a car of length len across the viewport width (used on tall screens)
  const fitDist = (len) => (len * 0.58 + 0.45) / (Math.tan((camera.fov * Math.PI) / 360) * Math.min(W / H, 1.7))

  function introLights(now) {
    if (reduced) return 1
    if (state.introAt < 0) return 0
    const t = (now - state.introAt) / 1000
    if (t < 0.25) return 0
    if (t < 0.32) return 0.9
    if (t < 0.45) return 0.08
    if (t < 0.52) return 1
    if (t < 0.62) return 0.35
    return smooth(0.62, 1.4, t) * 0.65 + 0.35
  }
  function introReveal(now) {
    if (reduced) return 1
    if (state.introAt < 0) return 0
    return smooth(0.45, 2.4, (now - state.introAt) / 1000)
  }
  function introHead(now) {
    if (reduced) return 1
    if (state.introAt < 0) return 0
    const t = (now - state.introAt) / 1000
    return t < 1.5 ? 0 : t < 1.58 ? 1 : t < 1.7 ? 0.2 : smooth(1.7, 2.1, t)
  }

  function showCar(i) {
    if (i === lastCar) return
    cars.forEach((c, k) => c && (c.visible = k === i))
    lastCar = i
    attachHeads(cars[i])
    state.hotspotEls.forEach((el, k) => {
      const hs = cars[i].userData.hotspots[k]
      el.style.display = hs ? '' : 'none'
      if (hs) el.querySelector('[data-label]').textContent = hs.label
    })
  }

  function rollWheels(car, x) {
    const px = prevX.has(car) ? prevX.get(car) : x
    const d = x - px
    prevX.set(car, x)
    if (!d) return
    for (const w of car.userData.wheels) w.userData.spin.rotation.z -= (w.userData.dir * d) / car.userData.R
  }

  const tmpV = new THREE.Vector3()
  const tmpN = new THREE.Vector3()
  const camDir = new THREE.Vector3()

  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000))
    lastT = now
    const k = 1 - Math.exp(-dt * 5)

    let tgt
    let carIndex
    let carX = 0
    let reveal = 1
    let angle = 0
    let hotspotOn = false
    if (state.mode === 'hero') {
      carIndex = 0
      const p = state.heroP
      tgt = {
        az: 0.92 - p * 0.5,
        h: 1.5 + p * 2.6,
        dist: (portrait() ? fitDist(4.9) : 11.2) + p * 2.5,
        lookY: 0.85 - p * 0.2,
        sx: 0,
        sy: portrait() ? 0.2 : 0.17,
        lights: introLights(now),
        head: introHead(now),
      }
      // gentle sway, never turning the unseen rear towards the camera
      angle = cars[0]?.userData.photo
        ? -0.1 + (reduced ? 0 : 0.15 * Math.sin(now * 0.00035)) + p * 0.3 // photo models: stay on the photographed side
        : (reduced ? 0 : 0.25 * Math.sin(now * 0.0002)) + p * 1.1
      reveal = introReveal(now)
    } else {
      const T = Math.min(4, Math.max(0, state.T))
      carIndex = Math.min(3, Math.floor(T))
      const t = T - carIndex
      const last = carIndex === 3
      reveal = smooth(0.03, 0.2, t) * (last ? 1 : 1 - smooth(0.86, 0.98, t))
      // showcase sweep: head-on -> three-quarter -> side profile -> settle on three-quarter.
      // Kept inside the arc the reference photo actually covered, so no guessed surfaces show.
      const u = clamp01((t - 0.1) / 0.78)
      angle = cars[carIndex]?.userData.photo
        ? -0.55 + 1.1 * inOutCubic(clamp01(u / 0.72)) - 0.4 * inOutCubic(clamp01((u - 0.72) / 0.28))
        : -0.5 + Math.PI * 2 * inOutCubic(clamp01((t - 0.12) / 0.74)) + t * 0.4 // full 360° turn
      const sw = Math.sin(clamp01((t - 0.15) / 0.7) * Math.PI)
      const scale = (cars[carIndex]?.userData.length ?? 4.2) / 4.2
      const side = carIndex % 2 === 0 ? 1 : -1
      tgt = {
        az: 0.85 + side * 0.06 + sw * 0.18,
        h: 1.3 + sw * 1.5,
        dist: portrait() ? fitDist(cars[carIndex]?.userData.length ?? 4.2) * (1 - sw * 0.05) : (10.2 - sw * 0.6) * (0.75 + scale * 0.25),
        lookY: 0.7,
        sx: portrait() ? 0 : side * 0.2 * (carIndex === 0 ? smooth(0, 0.12, t) : 1),
        sy: portrait() ? 0.24 : 0.04,
        lights: smooth(0.1, 0.22, t) * (last ? 1 : 1 - 0.85 * smooth(0.84, 0.95, t)),
        head: smooth(0.02, 0.1, t) * (last ? 1 : 1 - smooth(0.95, 1, t)),
      }
      hotspotOn = t > 0.3 && t < 0.8
    }

    const car = cars[carIndex]
    if (!car) return
    showCar(carIndex)
    car.position.x = carX
    rollWheels(car, carX)
    const rv = car.userData.reveal
    rv.value = reveal
    car.visible = reveal > 0.001
    car.traverse((o) => o.isMesh && (o.castShadow = reveal > 0.95))
    spinner.rotation.y = angle

    for (const key of ['az', 'h', 'dist', 'lookY', 'sx', 'sy', 'head']) state[key] = lerp(state[key], tgt[key], key === 'head' ? 0.35 : k)
    state.lights = lerp(state.lights, tgt.lights, 0.3)

    // camera
    camera.position.set(Math.sin(state.az) * state.dist, state.h, Math.cos(state.az) * state.dist)
    camera.lookAt(0, state.lookY, 0)
    camera.setViewOffset(W, H, -state.sx * W, state.sy * H, W, H)

    // lights
    const L = state.lights
    spots.forEach((s) => (s.intensity = s.userData.power * L))
    beams.forEach((m) => (m.uniforms.uOpacity.value = L))
    hemi.intensity = 0.04 + 0.34 * L
    ringMat.emissiveIntensity = 0.08 + 0.55 * L
    faceMat.color.setScalar(0.1 + 0.9 * L)
    dustMat.opacity = 0.55 * L
    const hd = state.head
    heads.forEach((h) => (h.intensity = 55 * hd))
    car.userData.glowMat.opacity = hd
    car.userData.lens.emissiveIntensity = 2.4 * hd

    // dust drift
    const arr = dustGeo.attributes.position.array
    const tt = now * 0.0002
    for (let i = 0; i < DUST; i++) {
      const s = dustSeed[i]
      arr[i * 3] = dustBase[i * 3] + Math.sin(tt + s) * 0.25
      arr[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(tt * 0.7 + s * 2) * 0.35
      arr[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(tt * 0.9 + s) * 0.25
    }
    dustGeo.attributes.position.needsUpdate = true

    renderer.render(scene, camera)

    // hotspots (DOM)
    if (state.hotspotEls.length) {
      camera.getWorldPosition(camDir)
      const hs = car.userData.hotspots
      state.hotspotEls.forEach((el, i) => {
        const h = hs[i]
        if (!h) return
        tmpV.set(...h.p)
        car.localToWorld(tmpV)
        tmpN.set(...h.n).normalize().transformDirection(car.matrixWorld)
        const facing = tmpN.dot(camDir.clone().sub(tmpV).normalize())
        tmpV.project(camera)
        const x = (tmpV.x * 0.5 + 0.5) * W
        const y = (-tmpV.y * 0.5 + 0.5) * H
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        el.classList.toggle('is-on', hotspotOn && facing > 0.2)
        el.classList.toggle('flip', x > W - 260)
      })
    }
  }

  return {
    load,
    get debug() {
      return { ...state, hotspotEls: undefined, W, H }
    },
    setMode(m) {
      if (state.mode === m) return
      state.mode = m
      prevX = new Map()
    },
    setHeroProgress(p) {
      state.heroP = p
    },
    setFleetTime(T) {
      state.T = T
    },
    setHotspotEls(els) {
      state.hotspotEls = els
    },
    intro() {
      if (state.introAt < 0) state.introAt = performance.now()
    },
    setActive(on) {
      if (on === state.active) return
      state.active = on
      if (on) {
        lastT = performance.now()
        raf = requestAnimationFrame(frame)
      } else cancelAnimationFrame(raf)
    },
    renderOnce() {
      frame(performance.now())
      cancelAnimationFrame(raf)
      if (state.active) raf = requestAnimationFrame(frame)
    },
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      pmrem.dispose()
    },
  }
}
