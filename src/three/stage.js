// The spotlit showroom: one fixed WebGL canvas behind the page.
// The page feeds it scroll state; it decides which car is on the turntable,
// where the camera is, and how bright the stage lights are.
import { THREE } from './kit.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
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

function blobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// Dust drifts on the GPU: the CPU never touches the particles after creation.
function dustMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uScale: { value: 400 }, uColor: { value: new THREE.Color(0xe6cf9f) } },
    vertexShader: /* glsl */ `
      attribute float seed; uniform float uTime; uniform float uScale;
      void main(){
        vec3 p = position + vec3(sin(uTime + seed) * 0.25, sin(uTime * 0.7 + seed * 2.0) * 0.35, cos(uTime * 0.9 + seed) * 0.25);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 0.022 * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uColor, uOpacity * smoothstep(0.5, 0.0, d)); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export function createStage(canvas) {
  const isMobile = window.matchMedia('(max-width: 820px)').matches
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lowPower = isMobile || isTouch

  // Desktop HiDPI screens skip MSAA and render below native resolution. Phones keep MSAA (cheap on
  // tile-based mobile GPUs) and render at 2x, because a small screen held close shows every jagged edge.
  const deviceDpr = window.devicePixelRatio || 1
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: deviceDpr < 2 || isTouch, powerPreference: 'high-performance', stencil: false })
  const maxDpr = Math.min(deviceDpr, isTouch ? 2 : 1.5)
  const minDpr = Math.min(deviceDpr, lowPower ? 1.25 : 1)
  let dpr = maxDpr
  renderer.setPixelRatio(dpr)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = !lowPower
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
  // rings + tick marks share one material, so they are merged into a single draw call
  const trim = []
  for (const [r, t, y] of [
    [3.3, 0.016, 0.119],
    [3.4, 0.012, 0.01],
    [2.55, 0.006, 0.121],
    [1.4, 0.005, 0.121],
  ]) {
    const g = new THREE.TorusGeometry(r, t, 8, 160)
    g.rotateX(Math.PI / 2)
    g.translate(0, y, 0)
    trim.push(g)
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const g = new THREE.BoxGeometry(0.18, 0.004, 0.012).toNonIndexed()
    g.rotateY(-a)
    g.translate(Math.cos(a) * 3.12, 0.122, Math.sin(a) * 3.12)
    trim.push(g)
  }
  spinner.add(new THREE.Mesh(mergeGeometries(trim.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => (g.deleteAttribute('uv'), g))), ringMat))
  // glossy lacquered top (a real-time mirror here cost a second full render every frame)
  const top = new THREE.Mesh(
    new THREE.CircleGeometry(3.29, 96),
    new THREE.MeshPhysicalMaterial({ color: 0x050404, roughness: 0.14, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.55 }),
  )
  top.rotation.x = -Math.PI / 2
  top.position.y = 0.12
  top.receiveShadow = true
  spinner.add(top)
  const blobTex = blobTexture()

  /* ---------- cars ---------- */
  const cars = CAR_IDS.map(() => null)
  function mount(i, c) {
    c.position.y = 0.12
    c.visible = false
    if (!c.userData.reveal) c.userData.reveal = { value: 1 }
    c.userData.meshes = []
    c.traverse((o) => o.isMesh && c.userData.meshes.push(o))
    // soft contact shadow that grounds the car on every device, even with shadow maps off
    const len = c.userData.length ?? 4.2
    const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0 })
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(len * 1.15, 2.1), blobMat)
    blob.rotation.x = -Math.PI / 2
    blob.position.y = 0.006
    blob.renderOrder = 1
    c.add(blob)
    c.userData.blob = blobMat
    c.userData.shadowOn = null
    c.updateMatrixWorld(true)
    c.traverse((o) => {
      if (o !== c) {
        o.matrixAutoUpdate = false
        o.updateMatrix()
      }
    })
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
    // Warm up behind the loader: compile every shader (incl. shadow variants) and upload every
    // texture now, so no car causes a hitch the first time it appears mid-scroll.
    cars.forEach((c) => {
      c.visible = true
      c.userData.meshes.forEach((m) => (m.castShadow = true))
      c.userData.shadowOn = true
    })
    spots.forEach((sp) => (sp.intensity = 1))
    heads.forEach((h) => (h.intensity = 1))
    attachHeads(cars[0])
    renderer.compile(scene, camera)
    scene.traverse((o) => {
      const m = o.material
      if (!m) return
      for (const key of ['map', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'normalMap']) if (m[key]) renderer.initTexture(m[key])
    })
    renderer.render(scene, camera)
    cars.forEach((c) => {
      c.visible = false
      spinner.remove(c)
    })
    spots.forEach((sp) => (sp.intensity = 0))
    heads.forEach((h) => (h.intensity = 0))
    lastCar = -1
    headCar = null
  }

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xcdb89a, 0x070504, 0.2)
  scene.add(hemi)
  const target = new THREE.Object3D()
  target.position.set(0, 0.6, 0)
  scene.add(target)

  const fixtures = [
    { pos: new THREE.Vector3(-5.2, 9.5, 4.2), color: 0xffe2b8, power: 950, shadow: true },
    { pos: new THREE.Vector3(5.6, 9.5, 3.4), color: 0xfff0d8, power: 700, shadow: false },
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
      s.shadow.mapSize.set(1024, 1024)
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
  const DUST = lowPower ? 220 : 480
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
  dustGeo.setAttribute('seed', new THREE.BufferAttribute(dustSeed, 1))
  const dustMat = dustMaterial()
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.frustumCulled = false
  scene.add(dust)

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
  let lastT = performance.now()
  // adaptive resolution: drop render scale when frames run long, restore when there is headroom
  const perf = { acc: 0, n: 0, calm: 0, base: Infinity, ceil: maxDpr, skip: 2 }
  let W = 0
  let H = 0

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    if (w === W && Math.abs(h - H) < 120 && isMobile) return
    W = w
    H = h
    renderer.setSize(w, h, false)
    dustMat.uniforms.uScale.value = (h * dpr) / 2
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
    cars.forEach((c, k) => {
      if (!c) return
      if (k === i) spinner.add(c)
      else spinner.remove(c)
    })
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
  const tmpD = new THREE.Vector3()

  function setDpr(v) {
    dpr = v
    renderer.setPixelRatio(dpr)
    renderer.setSize(W, H, false)
    dustMat.uniforms.uScale.value = (H * dpr) / 2
  }
  function adapt(dt) {
    perf.acc += dt
    perf.n++
    if (perf.acc < 1) return
    const avg = (perf.acc / perf.n) * 1000
    perf.acc = 0
    perf.n = 0
    // the first seconds include shader compiles and texture uploads; judge the steady state only
    if (perf.skip > 0) return void perf.skip--
    // The fastest second seen approximates the display's frame cap. iOS Low Power Mode and some
    // Android battery savers pin rAF to 30fps; that is not the GPU struggling, so it must not cost
    // resolution. Only frames well beyond the cap count as slow. Real caps sit at 60 or 30fps, so a
    // device whose best is slower than ~28fps is simply slow and is judged against 60fps.
    perf.base = Math.min(perf.base, avg)
    const cap = perf.base <= 36 ? perf.base : 1000 / 60
    const slow = Math.max(19, cap * 1.35)
    const fast = Math.max(12, cap * 1.12)
    if (avg > slow && dpr > minDpr) {
      setDpr(Math.max(minDpr, dpr - 0.25))
      // a level that proved too slow is not retried, so resolution never see-saws
      perf.ceil = dpr
      perf.calm = 0
    } else if (avg < fast && dpr < perf.ceil) {
      if (++perf.calm >= 4) {
        setDpr(Math.min(perf.ceil, dpr + 0.25))
        perf.calm = 0
      }
    } else perf.calm = 0
  }

  const tgt = { az: 0, h: 0, dist: 0, lookY: 0, sx: 0, sy: 0, lights: 0, head: 0 }
  const RIG = ['az', 'h', 'dist', 'lookY', 'sx', 'sy', 'head']

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000))
    lastT = now
    if (dt > 0) adapt(dt)
    const k = 1 - Math.exp(-dt * 5)

    let carIndex
    let carX = 0
    let reveal = 1
    let angle = 0
    let hotspotOn = false
    if (state.mode === 'hero') {
      carIndex = 0
      const p = state.heroP
      tgt.az = 0.92 - p * 0.5
      tgt.h = 1.5 + p * 2.6
      tgt.dist = (portrait() ? fitDist(4.9) : 11.2) + p * 2.5
      tgt.lookY = 0.85 - p * 0.2
      tgt.sx = 0
      tgt.sy = portrait() ? 0.2 : 0.17
      tgt.lights = introLights(now)
      tgt.head = introHead(now)
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
      tgt.az = 0.85 + side * 0.06 + sw * 0.18
      tgt.h = 1.3 + sw * 1.5
      tgt.dist = portrait() ? fitDist(cars[carIndex]?.userData.length ?? 4.2) * (1 - sw * 0.05) : (10.2 - sw * 0.6) * (0.75 + scale * 0.25)
      tgt.lookY = 0.7
      tgt.sx = portrait() ? 0 : side * 0.2 * (carIndex === 0 ? smooth(0, 0.12, t) : 1)
      tgt.sy = portrait() ? 0.24 : 0.04
      tgt.lights = smooth(0.1, 0.22, t) * (last ? 1 : 1 - 0.85 * smooth(0.84, 0.95, t))
      tgt.head = smooth(0.02, 0.1, t) * (last ? 1 : 1 - smooth(0.95, 1, t))
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
    car.userData.blob.opacity = 0.75 * reveal
    const shadowOn = renderer.shadowMap.enabled && reveal > 0.95
    if (car.userData.shadowOn !== shadowOn) {
      car.userData.shadowOn = shadowOn
      car.userData.meshes.forEach((m) => (m.castShadow = shadowOn))
    }
    spinner.rotation.y = angle

    for (const key of RIG) state[key] = lerp(state[key], tgt[key], key === 'head' ? 0.35 : k)
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
    dustMat.uniforms.uOpacity.value = 0.55 * L
    const hd = state.head
    heads.forEach((h) => (h.intensity = 55 * hd))
    car.userData.glowMat.opacity = hd
    car.userData.lens.emissiveIntensity = 2.4 * hd

    dustMat.uniforms.uTime.value = now * 0.0002

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
        const facing = tmpN.dot(tmpD.subVectors(camDir, tmpV).normalize())
        tmpV.project(camera)
        const x = (tmpV.x * 0.5 + 0.5) * W
        const y = (-tmpV.y * 0.5 + 0.5) * H
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        const on = hotspotOn && facing > 0.2
        const flip = x > W - 260
        if (el._on !== on) el.classList.toggle('is-on', (el._on = on))
        if (el._flip !== flip) el.classList.toggle('flip', (el._flip = flip))
      })
    }
  }

  return {
    load,
    get debug() {
      let objects = 0
      scene.traverse(() => objects++)
      return { ...state, hotspotEls: undefined, W, H, dpr, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, objects }
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
        perf.acc = perf.n = 0
      }
    },
    /** Called from the shared GSAP ticker right after Lenis/ScrollTrigger update, so the 3D frame matches the scroll frame. */
    tick() {
      if (state.active) frame(performance.now())
    },
    dispose() {
      window.removeEventListener('resize', resize)
      renderer.dispose()
      pmrem.dispose()
    },
  }
}
