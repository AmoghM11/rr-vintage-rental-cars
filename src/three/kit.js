// Procedural modelling kit for the vintage cars.
// Convention: car faces +X, Y is up, +Z is the car's right-hand side. Ground at y = 0.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export { THREE }

const D2R = Math.PI / 180

/* ---------- path helpers ---------- */
export const arc = (cx, cy, r, a0, a1, n = 18) => {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * (i / n)) * D2R
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

/** Sweep a cross-section along a side-view path (XY plane) travelled front -> rear.
 *  profile = [[o, z]] where o is an offset along the path's outward ("up") normal. */
export function sweep(path, profile, { samples = 0, smooth = true } = {}) {
  let pts = path.map(([x, y]) => new THREE.Vector3(x, y, 0))
  if (smooth) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    pts = curve.getSpacedPoints(samples || Math.max(32, path.length * 6))
  }
  const N = pts.length
  const M = profile.length
  const pos = new Float32Array(N * M * 3)
  for (let i = 0; i < N; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(N - 1, i + 1)]
    let tx = b.x - a.x
    let ty = b.y - a.y
    const l = Math.hypot(tx, ty) || 1
    tx /= l
    ty /= l
    const nx = ty
    const ny = -tx
    for (let j = 0; j < M; j++) {
      const [o, z] = profile[j]
      const k = (i * M + j) * 3
      pos[k] = pts[i].x + nx * o
      pos[k + 1] = pts[i].y + ny * o
      pos[k + 2] = z
    }
  }
  const idx = []
  for (let i = 0; i < N - 1; i++)
    for (let j = 0; j < M - 1; j++) {
      const a = i * M + j
      const b = a + 1
      const c = a + M
      const d = c + 1
      idx.push(a, b, c, b, d, c)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Crowned wing section with turned-down lips. */
export const crownProfile = (w, crown, lip = 0, n = 14) => {
  const p = []
  if (lip) p.push([-lip, -w / 2 + 0.004])
  for (let j = 0; j <= n; j++) {
    const u = -1 + (2 * j) / n
    p.push([crown * (1 - u * u * u * u), (u * w) / 2])
  }
  if (lip) p.push([-lip, w / 2 - 0.004])
  return p
}

/** Bonnet section: vertical sides, rounded shoulders, slight crown on top. */
export const bonnetProfile = (w, h, r, crown = 0, n = 7) => {
  const p = [[0, -w / 2]]
  const oc = h - r
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 90 * D2R
    p.push([oc + r * Math.sin(t), -w / 2 + r - r * Math.cos(t)])
  }
  const span = w / 2 - r
  for (let i = 1; i < 8; i++) {
    const z = -span + (2 * span * i) / 8
    p.push([h + crown * (1 - (z / span) ** 2), z])
  }
  for (let i = n; i >= 0; i--) {
    const t = (i / n) * 90 * D2R
    p.push([oc + r * Math.sin(t), w / 2 - r + r * Math.cos(t)])
  }
  p.push([0, w / 2])
  return p
}

/** Closed side-profile shape from control points, smoothed. */
export function smoothShape(points, divisions = 90) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    'centripetal',
  )
  const pts = curve.getSpacedPoints(divisions).map((v) => new THREE.Vector2(v.x, v.y))
  return new THREE.Shape(pts)
}

/** Extrude a side-view shape across the car's width (centred on z = 0). */
export function sideExtrude(shape, width, bevel = 0.05) {
  const depth = Math.max(0.01, width - bevel * 2)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 5,
    curveSegments: 24,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

/** A thin rod between two points. */
export function rod(a, b, r, seg = 6) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const len = A.distanceTo(B)
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false)
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    B.clone().sub(A).normalize(),
  )
  g.applyQuaternion(q)
  const m = A.clone().add(B).multiplyScalar(0.5)
  g.translate(m.x, m.y, m.z)
  return g
}

/** A tube through 3D points. */
export function tube(points, r, { closed = false, seg = 64, radial = 8 } = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
    'centripetal',
  )
  return new THREE.TubeGeometry(curve, seg, r, radial, closed)
}

/** Rounded-rectangle outline points in the YZ plane (bottom at y = 0). */
export function rectLoopYZ(w, h, r, x = 0, n = 5) {
  const pts = []
  const corners = [
    [h - r, w / 2 - r, 0],
    [h - r, -w / 2 + r, 90],
    [r, -w / 2 + r, 180],
    [r, w / 2 - r, 270],
  ]
  for (const [cy, cz, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (90 * i) / n) * D2R
      pts.push([x, cy + r * Math.sin(a), cz + r * Math.cos(a)])
    }
  return pts
}

export const rbox = (w, h, d, r = 0.02, s = 3) =>
  new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))

/* ---------- Builder: collects parts per material and merges them ---------- */
const tmpM = new THREE.Matrix4()
const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()
const tmpS = new THREE.Vector3()
const tmpP = new THREE.Vector3()

export function compose({ pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, order = 'XYZ' } = {}) {
  tmpE.set(rot[0], rot[1], rot[2], order)
  tmpQ.setFromEuler(tmpE)
  if (typeof scale === 'number') tmpS.set(scale, scale, scale)
  else tmpS.set(...scale)
  tmpP.set(...pos)
  return new THREE.Matrix4().compose(tmpP, tmpQ, tmpS)
}

function flipWinding(g) {
  for (const name of Object.keys(g.attributes)) {
    const at = g.attributes[name]
    const s = at.itemSize
    const arr = at.array
    for (let i = 0; i < at.count; i += 3) {
      for (let k = 0; k < s; k++) {
        const a = (i + 1) * s + k
        const b = (i + 2) * s + k
        const t = arr[a]
        arr[a] = arr[b]
        arr[b] = t
      }
    }
  }
}

export class Builder {
  constructor() {
    this.buckets = new Map()
    this.stack = [new THREE.Matrix4()]
  }

  /** Run fn with an extra transform pushed on the stack. */
  with(o, fn) {
    const top = this.stack[this.stack.length - 1]
    this.stack.push(top.clone().multiply(o.isMatrix4 ? o : compose(o)))
    fn(this)
    this.stack.pop()
    return this
  }

  add(geo, mat, o = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone()
    if (!g.attributes.normal) g.computeVertexNormals()
    const keepUV = !!mat.map
    for (const k of Object.keys(g.attributes))
      if (k !== 'position' && k !== 'normal' && !(keepUV && k === 'uv')) g.deleteAttribute(k)
    const top = this.stack[this.stack.length - 1]
    tmpM.copy(top).multiply(compose(o))
    g.applyMatrix4(tmpM)
    if (tmpM.determinant() < 0) flipWinding(g)
    this.push(mat, g)
    if (o.mirror) {
      // mirror across the car's centre plane (z = 0) in car space
      const m = g.clone()
      m.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1))
      flipWinding(m)
      this.push(mat, m)
    }
    return this
  }

  push(mat, g) {
    if (!this.buckets.has(mat)) this.buckets.set(mat, [])
    this.buckets.get(mat).push(g)
  }

  build(parent = new THREE.Group(), { cast = true, receive = true } = {}) {
    for (const [mat, geos] of this.buckets) {
      const merged = mergeGeometries(geos, false)
      if (!merged) continue
      const mesh = new THREE.Mesh(merged, mat)
      mesh.castShadow = cast
      mesh.receiveShadow = receive
      parent.add(mesh)
    }
    this.buckets.clear()
    return parent
  }
}

/* ---------- Materials ---------- */
let sharedMats = null
export function shared() {
  if (sharedMats) return sharedMats
  sharedMats = {
    chrome: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 1, roughness: 0.07 }),
    satin: new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 1, roughness: 0.28 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.86, metalness: 0 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.55, metalness: 0.2 }),
    gloss: new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.16,
      envMapIntensity: 2.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    dial: new THREE.MeshStandardMaterial({ color: 0xf1e8d4, roughness: 0.5 }),
    wood: new THREE.MeshPhysicalMaterial({ color: 0x5a2f14, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }),
    tail: new THREE.MeshStandardMaterial({ color: 0x5a0000, emissive: 0xff1a1a, emissiveIntensity: 0.35, roughness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: 0x6a4a10, emissive: 0xffa31a, emissiveIntensity: 0.2, roughness: 0.3 }),
  }
  return sharedMats
}

export function paint(hex, { rough = 0.26, metal = 0.25 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    roughness: rough,
    metalness: metal,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  })
}

export function leather(hex) {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.35,
    sheenColor: new THREE.Color(hex).offsetHSL(0, 0, 0.08),
    sheenRoughness: 0.5,
  })
}

export function lensMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: 0xffe2a8,
    emissiveIntensity: 0,
    roughness: 0.05,
    metalness: 0.3,
  })
}

/* ---------- Glow sprite for lamps ---------- */
let glowTex = null
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,244,214,1)')
  g.addColorStop(0.18, 'rgba(255,226,170,0.55)')
  g.addColorStop(0.5, 'rgba(255,200,120,0.12)')
  g.addColorStop(1, 'rgba(255,200,120,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  glowTex.colorSpace = THREE.SRGBColorSpace
  return glowTex
}

/* ---------- Wheels ---------- */
const superE = (v, e) => Math.sign(v) * Math.abs(v) ** e

export function buildWheel(opts) {
  const {
    R,
    h,
    w,
    type = 'wire',
    spokes = 40,
    rimMat,
    spokeMat,
    hubMat,
    discMat,
    whitewall = false,
  } = opts
  const S = shared()
  const b = new Builder()
  const ri = R - h

  // tyre
  const prof = []
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 2
    prof.push(new THREE.Vector2(ri + h / 2 + (h / 2) * superE(Math.cos(a), 0.55), (w / 2) * superE(Math.sin(a), 0.7)))
  }
  const tyre = new THREE.LatheGeometry(prof, 56)
  tyre.rotateX(Math.PI / 2)
  b.add(tyre, S.rubber)
  // tread grooves
  for (const z of [-w * 0.18, w * 0.18]) {
    const t = new THREE.TorusGeometry(R - 0.002, 0.006, 4, 72)
    b.add(t, S.black, { pos: [0, 0, z] })
  }
  if (whitewall) {
    const ww = new THREE.RingGeometry(ri + h * 0.22, ri + h * 0.62, 56)
    b.add(ww, new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 0.6 }), { pos: [0, 0, w / 2 + 0.003] })
  }

  // rim band + lips
  const band = new THREE.CylinderGeometry(ri + 0.004, ri + 0.004, w * 0.62, 56, 1, true)
  band.rotateX(Math.PI / 2)
  b.add(band, rimMat)
  for (const z of [-w * 0.31, w * 0.31]) b.add(new THREE.TorusGeometry(ri + 0.006, 0.008, 6, 56), rimMat, { pos: [0, 0, z] })

  if (type === 'wire') {
    const hub = new THREE.CylinderGeometry(0.05, 0.075, w * 0.9, 20)
    hub.rotateX(Math.PI / 2)
    b.add(hub, hubMat)
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2
      const lace = k % 4 < 2 ? 0.16 : -0.16
      const zh = (k % 2 ? 1 : -1) * w * 0.34
      const zr = (k % 2 ? -1 : 1) * w * 0.06
      const ra = ri - 0.006
      b.add(
        rod(
          [0.062 * Math.cos(a), 0.062 * Math.sin(a), zh],
          [ra * Math.cos(a + lace), ra * Math.sin(a + lace), zr],
          0.0045,
          4,
        ),
        spokeMat,
      )
    }
    // knock-off spinner
    const nut = new THREE.CylinderGeometry(0.042, 0.052, 0.07, 8)
    nut.rotateX(Math.PI / 2)
    b.add(nut, S.chrome, { pos: [0, 0, w * 0.5 + 0.02] })
    for (const s of [-1, 1]) b.add(rbox(0.026, 0.13, 0.022, 0.008), S.chrome, { pos: [0, s * 0.06, w * 0.5 + 0.035], rot: [0, 0, 0] })
  } else {
    // dished disc
    const dp = [
      [0.0, w * 0.32],
      [0.1, w * 0.32],
      [0.13, w * 0.18],
      [ri * 0.62, w * 0.12],
      [ri * 0.78, w * 0.24],
      [ri * 0.92, w * 0.2],
      [ri + 0.004, w * 0.05],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const disc = new THREE.LatheGeometry(dp, 56)
    disc.rotateX(Math.PI / 2)
    b.add(disc, discMat)
    if (opts.ribs) {
      for (let k = 0; k < opts.ribs; k++) {
        const a = (k / opts.ribs) * Math.PI * 2
        b.add(
          rod([0.14 * Math.cos(a), 0.14 * Math.sin(a), w * 0.2], [ri * 0.6 * Math.cos(a), ri * 0.6 * Math.sin(a), w * 0.14], 0.006, 4),
          S.chrome,
        )
      }
    }
    const cap = new THREE.SphereGeometry(0.1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)
    cap.rotateX(Math.PI / 2)
    cap.scale(1, 1, 0.55)
    b.add(cap, S.chrome, { pos: [0, 0, w * 0.32] })
  }

  const group = new THREE.Group()
  const spin = new THREE.Group()
  group.add(spin)
  b.build(spin)
  return group
}

/* ---------- Headlamp ---------- */
export function headlamp(b, lens, { r, depth = r * 1.05, body = null }) {
  const S = shared()
  const prof = []
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * (Math.PI / 2)
    prof.push(new THREE.Vector2(r * Math.sin(t), -depth * Math.cos(t)))
  }
  prof.push(new THREE.Vector2(r * 1.07, 0.004), new THREE.Vector2(r * 1.02, 0.018))
  const bowl = new THREE.LatheGeometry(prof, 32)
  bowl.rotateZ(-Math.PI / 2)
  b.add(bowl, body || S.chrome)
  const glass = new THREE.SphereGeometry(r * 0.99, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  glass.rotateZ(-Math.PI / 2)
  glass.scale(0.3, 1, 1)
  b.add(glass, lens)
}

/* ---------- Seats with pleated backs ---------- */
export function seat(b, mat, { x, y, w, d = 0.5, back = 0.42, tilt = 0.18, z = 0, pleats = 0 }) {
  b.add(rbox(d, 0.14, w, 0.05), mat, { pos: [x, y + 0.07, z] })
  const n = pleats || Math.max(4, Math.round(w / 0.085))
  const pw = w / n
  const bx = x - d / 2 + 0.05
  for (let i = 0; i < n; i++) {
    const zz = z - w / 2 + pw * (i + 0.5)
    b.add(rbox(0.12, back, pw - 0.006, 0.045), mat, {
      pos: [bx - Math.sin(tilt) * back * 0.5, y + 0.1 + Math.cos(tilt) * back * 0.5, zz],
      rot: [0, 0, tilt],
    })
  }
  // top roll
  const roll = new THREE.CapsuleGeometry(0.05, w - 0.1, 4, 10)
  roll.rotateX(Math.PI / 2)
  b.add(roll, mat, { pos: [bx - Math.sin(tilt) * back - 0.01, y + 0.1 + Math.cos(tilt) * back, z] })
}

/* ---------- Steering wheel ---------- */
export function steering(b, { x, y, z, r = 0.19, tilt = -0.65, rimMat }) {
  const S = shared()
  b.with({ pos: [x, y, z], rot: [0, 0, tilt] }, () => {
    const rim = new THREE.TorusGeometry(r, 0.013, 8, 40)
    rim.rotateY(Math.PI / 2)
    b.add(rim, rimMat || S.black)
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 2
      b.add(rod([0, 0, 0], [0, r * Math.sin(a), r * Math.cos(a)], 0.007), S.satin)
    }
    const boss = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16)
    boss.rotateZ(Math.PI / 2)
    b.add(boss, S.chrome)
    b.add(rod([0, 0, 0], [0.7, 0, 0], 0.017), S.black)
  })
}

/* ---------- Windscreen ---------- */
export function windscreen(b, { x, y, h, w, rake = 0.12, split = false, frameMat }) {
  const S = shared()
  b.with({ pos: [x, y, 0], rot: [0, 0, rake] }, () => {
    const panes = split ? [-w / 4 - 0.005, w / 4 + 0.005] : [0]
    const pw = split ? w / 2 - 0.02 : w
    for (const zc of panes) {
      b.add(tube(rectLoopYZ(pw, h, 0.035, 0).map(([px, py, pz]) => [px, py, pz + zc]), 0.012, { closed: true, seg: 90, radial: 6 }), frameMat || S.chrome)
      const glass = new THREE.PlaneGeometry(pw - 0.02, h - 0.02)
      glass.rotateY(Math.PI / 2)
      b.add(glass, S.glass, { pos: [0, h / 2, zc] })
    }
    // stanchions
    for (const s of [-1, 1]) b.add(rod([0, -0.06, s * (w / 2 + 0.02)], [0, h * 0.55, s * (w / 2 + 0.02)], 0.014), frameMat || S.chrome)
  })
}

/* ---------- Bumper ---------- */
export function bumper(b, { x, y, w, r = 0.032, over = true }) {
  const S = shared()
  const bar = new THREE.CapsuleGeometry(r, w, 4, 14)
  bar.rotateX(Math.PI / 2)
  b.add(bar, S.chrome, { pos: [x, y, 0] })
  const bar2 = new THREE.CapsuleGeometry(r * 0.8, w * 0.96, 4, 12)
  bar2.rotateX(Math.PI / 2)
  b.add(bar2, S.chrome, { pos: [x, y + r * 2.6, 0] })
  if (over)
    for (const s of [-1, 1]) b.add(new THREE.CapsuleGeometry(0.026, 0.13, 4, 10), S.chrome, { pos: [x + 0.01, y + r * 1.3, s * w * 0.3] })
  for (const s of [-1, 1]) b.add(rod([x, y, s * w * 0.22], [x - Math.sign(x) * 0.25, y + 0.02, s * w * 0.22], 0.012), S.black)
}

/* ---------- Number plate (canvas texture) ---------- */
export function plateMat(text) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#0b0b0b'
  x.fillRect(0, 0, 512, 128)
  x.strokeStyle = '#c9a56b'
  x.lineWidth = 6
  x.strokeRect(8, 8, 496, 112)
  x.fillStyle = '#efe6d2'
  let size = 66
  x.font = `600 ${size}px Georgia, serif`
  while (x.measureText(text).width > 450 && size > 30) x.font = `600 ${--size}px Georgia, serif`
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillText(text, 256, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.1 })
}

export function plate(b, mat, { x, y, facing = 1, w = 0.42, h = 0.11 }) {
  const g = new THREE.PlaneGeometry(w, h)
  g.rotateY(facing > 0 ? Math.PI / 2 : -Math.PI / 2)
  b.add(g, mat, { pos: [x, y, 0] })
  b.add(rbox(0.012, h + 0.02, w + 0.02, 0.004), shared().black, { pos: [x - facing * 0.008, y, 0] })
}
