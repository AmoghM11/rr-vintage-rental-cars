// The four cars of the RR Vintage fleet, built procedurally from proportions
// taken from the client's reference photos. Units are metres; car faces +X.
import {
  THREE,
  Builder,
  arc,
  sweep,
  crownProfile,
  bonnetProfile,
  sideExtrude,
  rod,
  tube,
  rbox,
  shared,
  paint,
  leather,
  lensMat,
  glowTexture,
  buildWheel,
  headlamp,
  seat,
  steering,
  windscreen,
  bumper,
  plateMat,
  plate,
} from './kit.js'

/* Tiny path DSL -> THREE.Shape. ['M',x,y] ['L',x,y] ['Q',cx,cy,x,y] */
function dsl(cmds) {
  const s = new THREE.Shape()
  for (const c of cmds) {
    if (c[0] === 'M') s.moveTo(c[1], c[2])
    else if (c[0] === 'L') s.lineTo(c[1], c[2])
    else if (c[0] === 'Q') s.quadraticCurveTo(c[1], c[2], c[3], c[4])
  }
  return s
}

/* ---------------- ornaments ---------------- */
function ecstasy(b, mat, pos) {
  const s = dsl([
    ['M', 0, 0],
    ['L', 0.022, 0],
    ['Q', 0.03, 0.04, 0.06, 0.07],
    ['L', 0.085, 0.1],
    ['Q', 0.09, 0.118, 0.075, 0.118],
    ['L', 0.05, 0.106],
    ['Q', 0.02, 0.112, -0.03, 0.128],
    ['Q', -0.075, 0.118, -0.05, 0.096],
    ['Q', -0.01, 0.088, 0.015, 0.07],
    ['Q', -0.002, 0.035, -0.008, 0],
  ])
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 })
  g.translate(0, 0, -0.006)
  b.add(g, mat, { pos })
}

function wingsBadge(b, mat, pos, scale = 1) {
  const pts = [
    [0.02, 0.012], [0.07, 0.04], [0.13, 0.052], [0.11, 0.038], [0.15, 0.036], [0.11, 0.022],
    [0.13, 0.014], [0.09, 0.008], [0.1, -0.002], [0.04, -0.008], [0.02, -0.014],
  ]
  const s = new THREE.Shape()
  s.moveTo(0, -0.018)
  for (const [x, y] of pts) s.lineTo(x, y)
  s.lineTo(0, 0.03)
  for (const [x, y] of pts.slice().reverse()) s.lineTo(-x, y)
  s.lineTo(0, -0.018)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 })
  g.rotateY(Math.PI / 2)
  b.add(g, mat, { pos, scale })
  const disc = new THREE.CylinderGeometry(0.026, 0.026, 0.02, 24)
  disc.rotateZ(Math.PI / 2)
  b.add(disc, mat, { pos: [pos[0] + 0.006, pos[1] + 0.005 * scale, pos[2]], scale })
}

/* ---------------- radiators ---------------- */
function slatRadiator(b, M, r) {
  const S = shared()
  const { w, h, d, t } = r
  const shell = r.shellMat === 'paint' ? M.paint : S.chrome
  b.with({ pos: [r.x, r.yb, 0], rot: [0, 0, r.rake || 0] }, () => {
    b.add(rbox(d * 0.8, h - t, w - 0.03, 0.01), S.black, { pos: [-d / 2 - 0.015, h / 2, 0] })
    b.add(rbox(d, h, t, t * 0.45), shell, { pos: [-d / 2, h / 2, (w - t) / 2], mirror: true })
    b.add(rbox(d, t, w, t * 0.45), shell, { pos: [-d / 2, t / 2, 0] })
    b.add(rbox(d + 0.012, t * 1.35, w + 0.012, t * 0.5), shell, { pos: [-d / 2, h - t * 0.6, 0] })
    if (r.kind === 'parthenon') {
      const s = dsl([['M', -w / 2 - 0.006, 0], ['L', w / 2 + 0.006, 0], ['L', 0, 0.045], ['L', -w / 2 - 0.006, 0]])
      const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.012, bevelEnabled: false })
      g.rotateY(Math.PI / 2)
      b.add(g, shell, { pos: [-d - 0.006, h + t * 0.05, 0] })
      b.add(rbox(0.008, 0.032, 0.07, 0.004), M.badge, { pos: [0.004, h - t * 0.6, 0] })
    }
    const wi = w - 2 * t
    const n = r.slats
    for (let i = 0; i < n; i++) {
      const z = -wi / 2 + (wi * (i + 0.5)) / n
      const centre = r.centreBar && Math.abs(z) < wi / n
      b.add(rbox(0.016, h - 2 * t, centre ? 0.022 : Math.min(0.011, (wi / n) * 0.5), 0.003), S.chrome, { pos: [-0.012, h / 2, z] })
    }
    if (r.centreBar && n % 2 === 0) b.add(rbox(0.02, h - 2 * t, 0.024, 0.006), S.chrome, { pos: [-0.008, h / 2, 0] })
    // filler cap
    const cap = new THREE.CylinderGeometry(0.03, 0.038, 0.05, 20)
    const capY = h + (r.kind === 'parthenon' ? 0.05 : 0.01)
    b.add(cap, S.chrome, { pos: [-d * 0.45, capY + 0.025, 0] })
    if (r.mascot === 'ecstasy') ecstasy(b, S.chrome, [-d * 0.45 - 0.01, capY + 0.05, 0])
    if (r.mascot === 'wings') wingsBadge(b, S.chrome, [-d * 0.45, capY + 0.08, 0], 1.2)
    if (r.badge === 'octagon') {
      const o = new THREE.CylinderGeometry(0.05, 0.05, 0.014, 8)
      o.rotateZ(Math.PI / 2)
      b.add(o, S.chrome, { pos: [0.006, h - t * 0.6, 0] })
      const f = new THREE.CylinderGeometry(0.038, 0.038, 0.016, 8)
      f.rotateZ(Math.PI / 2)
      b.add(f, M.badge, { pos: [0.008, h - t * 0.6, 0] })
    }
  })
}

function archRadiator(b, M, r) {
  const S = shared()
  const { w, h, d, curve = 0.07 } = r
  const a = w / 2
  const hr = h - a
  const xOf = (z) => -curve * (z / a) ** 2
  b.with({ pos: [r.x, r.yb, 0], rot: [0, 0, r.rake || 0] }, () => {
    // outline in (z, y)
    const outline = []
    outline.push([-a, 0])
    outline.push([-a, hr])
    for (let i = 1; i < 24; i++) {
      const t = Math.PI - (i / 24) * Math.PI
      outline.push([a * Math.cos(t), hr + a * Math.sin(t)])
    }
    outline.push([a, hr])
    outline.push([a, 0])
    // chrome surround (open at bottom, closed via bottom bar)
    b.add(tube(outline.map(([z, y]) => [xOf(z), y, z]), 0.017, { seg: 80 }), S.chrome)
    b.add(rod([xOf(a), 0, -a], [xOf(a), 0, a], 0.017), S.chrome)
    // painted cowl around it
    const outer = new THREE.Shape()
    const grow = 0.045
    outer.moveTo(-a - grow, -0.02)
    outer.lineTo(-a - grow, hr)
    outer.absarc(0, hr, a + grow, Math.PI, 0, true)
    outer.lineTo(a + grow, -0.02)
    outer.lineTo(-a - grow, -0.02)
    const hole = new THREE.Path()
    hole.moveTo(-a, 0)
    hole.lineTo(-a, hr)
    hole.absarc(0, hr, a, Math.PI, 0, true)
    hole.lineTo(a, 0)
    hole.lineTo(-a, 0)
    outer.holes.push(hole)
    const cowl = new THREE.ExtrudeGeometry(outer, { depth: d, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24 })
    cowl.rotateY(Math.PI / 2)
    b.add(cowl, M.paint, { pos: [-d - 0.02, 0, 0] })
    // backing
    const back = new THREE.Shape()
    back.moveTo(-a, 0)
    back.lineTo(-a, hr)
    back.absarc(0, hr, a, Math.PI, 0, true)
    back.lineTo(a, 0)
    const bg = new THREE.ExtrudeGeometry(back, { depth: 0.02, bevelEnabled: false, curveSegments: 20 })
    bg.rotateY(Math.PI / 2)
    b.add(bg, S.black, { pos: [-curve - 0.06, 0, 0] })
    // slats
    const n = r.slats
    for (let i = 0; i < n; i++) {
      const z = -a + 0.02 + ((2 * a - 0.04) * (i + 0.5)) / n
      const top = hr + Math.sqrt(Math.max(0, a * a - z * z)) - 0.025
      b.add(rbox(0.014, top - 0.02, 0.009, 0.003), S.chrome, { pos: [xOf(z) - 0.01, 0.02 + (top - 0.02) / 2, z] })
    }
  })
}

/* ---------------- the generic vintage car ---------------- */
function buildVintage(s) {
  const S = shared()
  const M = {
    paint: paint(s.paint, s.paintOpts),
    leather: leather(s.leather),
    lens: lensMat(),
    badge: new THREE.MeshStandardMaterial({ color: s.badgeColor || 0x6b0f16, roughness: 0.4, metalness: 0.3 }),
  }
  M.wing = s.wingPaint ? paint(s.wingPaint) : M.paint
  const car = new THREE.Group()
  car.name = s.id
  const body = new THREE.Group()
  car.add(body)
  const b = new Builder()
  const { R, wb, track } = s
  const fx = wb / 2
  const rx = -wb / 2
  const zw = track / 2

  /* chassis */
  b.add(rbox(wb + 0.7, 0.11, 0.07, 0.02), S.black, { pos: [0.1, s.frameY, zw * 0.5], mirror: true })
  b.add(rod([fx, R * 0.92, -zw + 0.08], [fx, R * 0.92, zw - 0.08], 0.032), S.black)
  b.add(rod([rx, R, -zw + 0.08], [rx, R, zw - 0.08], 0.045), S.black)
  b.add(new THREE.SphereGeometry(0.13, 18, 12), S.black, { pos: [rx, R, 0] })
  b.add(rbox(wb * 0.9, 0.12, track * 0.62, 0.03), S.black, { pos: [0, s.frameY - 0.04, 0] })
  for (const ax of [fx, rx])
    b.add(tube([[ax + 0.45, s.frameY - 0.02, zw * 0.52], [ax, R * 0.86, zw * 0.52], [ax - 0.45, s.frameY - 0.02, zw * 0.52]], 0.018, { seg: 16, radial: 5 }), S.black, { mirror: true })

  /* radiator */
  if (s.radiator.kind === 'arch') archRadiator(b, M, s.radiator)
  else slatRadiator(b, M, s.radiator)

  /* bonnet */
  const bn = s.bonnet
  b.add(sweep([[bn.xf, bn.yf ?? bn.yb], [bn.xr, bn.yb]], bonnetProfile(bn.w, bn.h, bn.r, bn.crown || 0), { smooth: false }), M.paint)
  // hinge strip
  b.add(rod([bn.xf, (bn.yf ?? bn.yb) + bn.h + (bn.crown || 0) + 0.004, 0], [bn.xr, bn.yb + bn.h + (bn.crown || 0) + 0.004, 0], 0.007), S.chrome)
  if (bn.louvers) {
    const L = bn.louvers
    for (let i = 0; i < L.n; i++) {
      const x = L.x0 + ((L.x1 - L.x0) * i) / (L.n - 1)
      const len = L.y1 - L.y0
      b.add(rbox(0.02, len, 0.012, 0.005), M.paint, { pos: [x + 0.012, (L.y0 + L.y1) / 2, bn.w / 2 + 0.004], mirror: true })
      b.add(rbox(0.008, len * 0.92, 0.006, 0.002), S.black, { pos: [x, (L.y0 + L.y1) / 2, bn.w / 2 + 0.003], mirror: true })
    }
  }
  if (bn.strip) b.add(rod([bn.strip.x0, bn.strip.y, bn.w / 2 + 0.006], [bn.strip.x1, bn.strip.y, bn.w / 2 + 0.006], 0.008), S.chrome, { mirror: true })

  /* scuttle taper (wide-bodied tourers) */
  if (s.scuttle) {
    const sc = s.scuttle
    const plan = dsl([['M', sc.x0, -sc.w0 / 2], ['L', sc.x0, sc.w0 / 2], ['L', sc.x1, sc.w1 / 2], ['L', sc.x1, -sc.w1 / 2], ['L', sc.x0, -sc.w0 / 2]])
    const g = new THREE.ExtrudeGeometry(plan, { depth: sc.y1 - sc.y0, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4 })
    g.rotateX(-Math.PI / 2)
    b.add(g, M.paint, { pos: [0, sc.y0, 0] })
  }

  /* tub, cockpit walls, interior */
  const tb = s.tub
  b.add(sideExtrude(dsl(tb.shape), tb.w, 0.06), M.paint)
  const wall = dsl(tb.wall)
  b.add(sideExtrude(wall, 0.075, 0.025), M.paint, { pos: [0, 0, tb.w / 2 - 0.04], mirror: true })
  b.add(sideExtrude(wall, 0.02, 0.006), M.leather, { pos: [0, -0.01, tb.w / 2 - 0.09], mirror: true })
  b.add(tube(tb.roll.map(([x, y]) => [x, y, tb.w / 2 - 0.05]), 0.026, { seg: 48, radial: 8 }), M.leather, { mirror: true })
  b.add(rbox(tb.floor.x0 - tb.floor.x1, 0.02, tb.w - 0.16, 0.008), S.black, { pos: [(tb.floor.x0 + tb.floor.x1) / 2, tb.floor.y + 0.01, 0] })
  for (const dx of tb.doorLines || []) b.add(rbox(0.006, dx[1], 0.004, 0.002), S.black, { pos: [dx[0], dx[2], tb.w / 2 + 0.003], mirror: true })
  for (const h of tb.handles || []) b.add(rbox(0.07, 0.015, 0.02, 0.006), S.chrome, { pos: [h[0], h[1], tb.w / 2 + 0.012], mirror: true })

  /* dashboard + dials */
  const da = s.dash
  b.add(rbox(0.03, da.h, tb.w - 0.2, 0.01), da.wood ? S.wood : S.gloss, { pos: [da.x, da.y, 0] })
  for (const [dz, dr] of da.dials) {
    const ring = new THREE.CylinderGeometry(dr + 0.008, dr + 0.008, 0.02, 24)
    ring.rotateZ(Math.PI / 2)
    b.add(ring, S.chrome, { pos: [da.x - 0.012, da.y + 0.01, dz] })
    const face = new THREE.CylinderGeometry(dr, dr, 0.022, 24)
    face.rotateZ(Math.PI / 2)
    b.add(face, S.dial, { pos: [da.x - 0.014, da.y + 0.01, dz] })
  }

  for (const st of s.seats) seat(b, M.leather, st)
  steering(b, { ...s.steer, rimMat: s.steer.wood ? S.wood : S.black })
  windscreen(b, s.screen)

  /* wings + running boards */
  const F = s.fenders
  for (const path of F.paths) b.add(sweep(path, crownProfile(F.w, F.crown, F.lip), { samples: 160 }), M.wing, { pos: [0, 0, F.z], mirror: true })
  if (s.board) {
    const bd = s.board
    b.add(rbox(bd.x0 - bd.x1, 0.035, bd.w, 0.012), S.rubber, { pos: [(bd.x0 + bd.x1) / 2, bd.y, F.z], mirror: true })
    b.add(rod([bd.x0, bd.y + 0.004, F.z + bd.w / 2], [bd.x1, bd.y + 0.004, F.z + bd.w / 2], 0.009), S.chrome, { mirror: true })
  }
  if (s.boardStrips) {
    const st = s.boardStrips
    for (let k = 0; k < 3; k++)
      b.add(rbox(st.x0 - st.x1, 0.01, 0.022, 0.004), S.rubber, { pos: [(st.x0 + st.x1) / 2, st.y, F.z - 0.06 + k * 0.06], mirror: true })
  }

  /* lamps */
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xffe4b0,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  })
  const lampPoints = []
  for (const L of s.lamps) {
    for (const side of [1, -1]) {
      const z = L.z * side
      b.with({ pos: [L.x, L.y, z] }, () => headlamp(b, M.lens, { r: L.r }))
      if (L.stalk) b.add(rod([L.x - L.r * 0.6, L.y - L.r * 0.5, z], [L.stalk[0], L.stalk[1], L.stalk[2] * side], 0.016), S.chrome)
      const sp = new THREE.Sprite(glowMat)
      sp.position.set(L.x + L.r * 0.4, L.y, z)
      sp.scale.setScalar(L.r * (L.main ? 9 : 6))
      car.add(sp)
      if (L.main) lampPoints.push(new THREE.Vector3(L.x + 0.05, L.y, z))
    }
  }
  if (s.lampBar) b.add(rod([s.lampBar.x, s.lampBar.y, -s.lampBar.z], [s.lampBar.x, s.lampBar.y, s.lampBar.z], 0.016), S.chrome)
  for (const tl of s.tailLamps || []) {
    const g = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 18)
    g.rotateZ(Math.PI / 2)
    b.add(g, S.chrome, { pos: [tl[0], tl[1], tl[2]], mirror: true })
    const lens = new THREE.SphereGeometry(0.03, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    lens.rotateZ(Math.PI / 2)
    b.add(lens, S.tail, { pos: [tl[0] - 0.02, tl[1], tl[2]], mirror: true })
  }

  for (const bp of s.bumpers || []) bumper(b, bp)
  const pm = plateMat(s.plate)
  for (const p of s.plates || []) plate(b, pm, p)

  /* extras */
  if (s.tank) {
    const t = s.tank
    b.add(rbox(t.d, t.h, t.w, 0.05), M.paint, { pos: [t.x, t.y, 0] })
    b.add(new THREE.CylinderGeometry(0.05, 0.055, 0.05, 20), S.chrome, { pos: [t.x, t.y + t.h / 2 + 0.02, -t.w * 0.3] })
    for (const zz of [-t.w * 0.4, t.w * 0.4]) b.add(rbox(t.d + 0.02, 0.025, 0.04, 0.008), S.chrome, { pos: [t.x, t.y + t.h / 2 - 0.05, zz] })
  }
  if (s.hood) {
    const h = s.hood
    const g = new THREE.CapsuleGeometry(h.r, h.len, 6, 14)
    g.rotateX(Math.PI / 2)
    g.scale(1.25, 0.8, 1)
    b.add(g, h.mat === 'leather' ? M.leather : new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.85 }), { pos: [h.x, h.y, 0] })
  }
  if (s.trunk) {
    const t = s.trunk
    b.add(rbox(t.d, t.h, t.w, 0.03), S.gloss, { pos: [t.x, t.y, 0] })
    for (const zz of [-t.w * 0.35, t.w * 0.35]) b.add(rbox(t.d + 0.012, t.h + 0.012, 0.03, 0.006), S.satin, { pos: [t.x, t.y, zz] })
    b.add(rbox(0.5, 0.03, t.w * 0.9, 0.01), S.black, { pos: [t.x + 0.12, t.y - t.h / 2 - 0.02, 0] })
  }
  if (s.exhaust) {
    for (const x of [1.02, 0.88, 0.74]) {
      b.add(
        tube([[x, 0.8, 0.355], [x - 0.04, 0.78, 0.48], [x - 0.12, 0.62, 0.6], [x - 0.3, 0.5, 0.64], [0.1, 0.47, 0.66], [-0.55, 0.47, 0.66]], 0.021, { seg: 70, radial: 10 }),
        S.chrome,
        { mirror: true },
      )
    }
  }
  if (s.ribbon) {
    const sat = new THREE.MeshPhysicalMaterial({ color: 0xfaf6ee, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide })
    const r0 = s.ribbon
    const g = tube([r0.from, [(r0.from[0] + r0.to[0]) / 2, r0.from[1] - 0.005, r0.to[2] * 0.45], r0.to], 0.012, { seg: 40, radial: 6 })
    g.scale(1, 0.35, 1)
    g.translate(0, (r0.from[1] + r0.to[1]) * 0.5 * 0.65, 0)
    b.add(g, sat, { mirror: true })
    for (const sd of [-1, 1]) {
      const loop = new THREE.TorusGeometry(0.06, 0.013, 6, 20)
      loop.scale(1.3, 0.8, 0.35)
      b.add(loop, sat, { pos: [r0.from[0] + 0.03, r0.from[1] + 0.03, sd * 0.07], rot: [0, 0, sd * 0.4] })
    }
    b.add(new THREE.SphereGeometry(0.025, 12, 8), sat, { pos: [r0.from[0] + 0.03, r0.from[1] + 0.03, 0] })
  }

  b.build(body)

  /* wheels */
  const W = s.wheel
  const proto = buildWheel({
    R,
    h: s.tyreH,
    w: s.tyreW,
    type: W.type,
    spokes: W.spokes,
    rimMat: W.rim === 'chrome' ? S.chrome : W.rim === 'paint' ? M.paint : S.gloss,
    spokeMat: W.spoke === 'chrome' ? S.chrome : S.gloss,
    hubMat: S.chrome,
    discMat: W.disc === 'chrome' ? S.satin : W.disc === 'paint' ? M.paint : S.gloss,
    ribs: W.ribs,
    whitewall: W.whitewall,
  })
  const wheels = []
  for (const [x, side] of [[fx, 1], [fx, -1], [rx, 1], [rx, -1]]) {
    const w = proto.clone()
    w.userData.spin = w.children[0]
    w.position.set(x, R, side * zw)
    if (side < 0) w.rotation.y = Math.PI
    w.userData.dir = side
    car.add(w)
    wheels.push(w)
  }
  if (s.spare) {
    const sp = proto.clone()
    sp.position.set(...s.spare.pos)
    sp.rotation.set(...s.spare.rot, s.spare.order || 'XYZ')
    car.add(sp)
  }

  car.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  car.userData = { wheels, R, glowMat, lens: M.lens, lampPoints, hotspots: s.hotspots, length: s.length, paint: M.paint }
  return car
}

/* ---------------- specs ---------------- */
const SPECS = {
  'rolls-royce': {
    id: 'rolls-royce',
    length: 4.9,
    paint: 0xeeeadf,
    paintOpts: { rough: 0.22, metal: 0.05 },
    leather: 0x3d0a13,
    plate: 'RR · 1907',
    R: 0.45,
    tyreH: 0.13,
    tyreW: 0.14,
    wb: 3.44,
    track: 1.46,
    frameY: 0.6,
    wheel: { type: 'wire', spokes: 40, rim: 'gloss', spoke: 'gloss' },
    radiator: { kind: 'parthenon', x: 1.64, yb: 0.78, h: 0.66, w: 0.56, d: 0.17, t: 0.046, slats: 22, mascot: 'ecstasy' },
    bonnet: { xf: 1.47, xr: 0.42, yb: 0.86, h: 0.53, w: 0.72, r: 0.05, crown: 0.02, louvers: { n: 11, x0: 0.98, x1: 0.56, y0: 0.98, y1: 1.24 } },
    scuttle: { x0: 0.43, x1: 0.06, w0: 0.72, w1: 1.24, y0: 0.66, y1: 1.38 },
    tub: {
      w: 1.28,
      shape: [['M', 0.06, 0.62], ['L', 0.06, 1.36], ['Q', 0.0, 1.42, -0.12, 1.38], ['L', -0.16, 0.95], ['L', -2.0, 0.95], ['L', -2.02, 1.26], ['Q', -2.32, 1.3, -2.35, 1.0], ['Q', -2.37, 0.66, -2.2, 0.62], ['L', 0.06, 0.62]],
      wall: [['M', -0.14, 0.9], ['L', -0.14, 1.36], ['Q', -0.2, 1.29, -0.34, 1.28], ['L', -2.0, 1.27], ['L', -2.0, 0.9], ['L', -0.14, 0.9]],
      roll: [[-0.15, 1.36], [-0.3, 1.29], [-1.2, 1.28], [-1.99, 1.28]],
      floor: { x0: -0.16, x1: -1.99, y: 0.95 },
      doorLines: [[-0.2, 0.62, 0.95], [-0.95, 0.62, 0.95], [-1.1, 0.62, 0.95], [-1.95, 0.62, 0.95]],
      handles: [[-0.88, 1.18], [-1.18, 1.18]],
    },
    dash: { x: -0.17, y: 1.24, h: 0.2, wood: true, dials: [[0.12, 0.04], [-0.05, 0.035], [-0.2, 0.035]] },
    seats: [
      { x: -0.58, y: 0.95, w: 1.1, d: 0.55, back: 0.46, tilt: 0.16 },
      { x: -1.62, y: 0.95, w: 1.12, d: 0.6, back: 0.5, tilt: 0.2 },
    ],
    steer: { x: -0.32, y: 1.44, z: 0.3, r: 0.22, wood: true },
    screen: { x: -0.06, y: 1.4, h: 0.46, w: 1.16, rake: 0.05, split: true },
    fenders: {
      w: 0.3,
      crown: 0.06,
      lip: 0.07,
      z: 0.73,
      paths: [
        [...arc(1.72, 0.45, 0.53, 6, 160, 26), [1.0, 0.58], [0.82, 0.565]],
        [[-1.05, 0.565], [-1.16, 0.62], ...arc(-1.72, 0.45, 0.53, 28, 178, 26), [-2.33, 0.42]],
      ],
    },
    board: { x0: 0.86, x1: -1.1, y: 0.555, w: 0.34 },
    lamps: [
      { x: 1.88, y: 1.08, z: 0.43, r: 0.13, main: true, stalk: [1.78, 0.62, 0.66] },
      { x: 0.4, y: 1.32, z: 0.48, r: 0.055 },
    ],
    lampBar: { x: 1.84, y: 0.93, z: 0.45 },
    tailLamps: [[-2.3, 0.52, 0.73]],
    bumpers: [{ x: 2.02, y: 0.6, w: 1.0, r: 0.022, over: false }],
    plates: [{ x: 2.0, y: 0.72, facing: 1 }],
    trunk: { x: -2.5, y: 0.86, d: 0.32, h: 0.38, w: 0.95 },
    hood: { x: -2.12, y: 1.36, len: 1.05, r: 0.1, mat: 'leather' },
    hotspots: [
      { label: 'Spirit of Ecstasy', p: [1.56, 1.58, 0], n: [0.3, 1, 0] },
      { label: 'Parthenon radiator', p: [1.66, 1.1, 0], n: [1, 0, 0] },
      { label: 'Black wire wheels', p: [-1.72, 0.45, 0.8], n: [0, 0, 1] },
    ],
  },

  mg: {
    id: 'mg',
    length: 3.7,
    paint: 0x0d3a3e,
    paintOpts: { rough: 0.24, metal: 0.45 },
    leather: 0xa8743f,
    badgeColor: 0x6a3b16,
    plate: 'RR · MG TD',
    R: 0.33,
    tyreH: 0.12,
    tyreW: 0.15,
    wb: 2.36,
    track: 1.28,
    frameY: 0.3,
    wheel: { type: 'disc', disc: 'gloss', rim: 'gloss' },
    radiator: { kind: 'slats', x: 1.3, yb: 0.42, h: 0.62, w: 0.48, d: 0.14, t: 0.042, rake: 0.1, slats: 18, centreBar: true, badge: 'octagon' },
    bonnet: { xf: 1.18, xr: 0.12, yb: 0.52, h: 0.47, w: 0.62, r: 0.08, crown: 0.015, louvers: { n: 14, x0: 0.98, x1: 0.42, y0: 0.64, y1: 0.88 } },
    tub: {
      w: 1.08,
      shape: [['M', 0.14, 0.4], ['L', 0.14, 0.97], ['Q', 0.08, 1.04, 0.0, 1.0], ['L', -0.04, 0.62], ['L', -0.88, 0.62], ['L', -0.9, 0.94], ['Q', -1.04, 0.98, -1.05, 0.8], ['L', -1.04, 0.48], ['Q', -1.0, 0.4, -0.9, 0.4], ['L', 0.14, 0.4]],
      wall: [['M', -0.03, 0.58], ['L', -0.03, 1.0], ['Q', -0.12, 0.86, -0.28, 0.84], ['L', -0.76, 0.84], ['Q', -0.86, 0.86, -0.9, 0.95], ['L', -0.9, 0.58], ['L', -0.03, 0.58]],
      roll: [[-0.04, 0.99], [-0.14, 0.86], [-0.5, 0.845], [-0.78, 0.85], [-0.89, 0.94]],
      floor: { x0: -0.05, x1: -0.88, y: 0.62 },
    },
    dash: { x: -0.06, y: 0.9, h: 0.15, wood: false, dials: [[0.2, 0.045], [0, 0.03], [-0.2, 0.045]] },
    seats: [{ x: -0.5, y: 0.62, w: 0.92, d: 0.46, back: 0.4, tilt: 0.2 }],
    steer: { x: -0.18, y: 1.0, z: 0.24, r: 0.2 },
    screen: { x: 0.08, y: 1.01, h: 0.36, w: 1.0, rake: 0.08, split: false },
    fenders: {
      w: 0.27,
      crown: 0.05,
      lip: 0.06,
      z: 0.64,
      paths: [[[1.64, 0.32], ...arc(1.18, 0.33, 0.41, 4, 172, 26), [0.6, 0.31], [0.42, 0.29], [-0.58, 0.29], [-0.7, 0.32], ...arc(-1.18, 0.33, 0.4, 14, 178, 26), [-1.64, 0.28]]],
    },
    boardStrips: { x0: 0.38, x1: -0.55, y: 0.35 },
    lamps: [
      { x: 1.4, y: 0.84, z: 0.38, r: 0.09, main: true, stalk: [1.32, 0.6, 0.5] },
      { x: 1.0, y: 0.8, z: 0.64, r: 0.035 },
    ],
    lampBar: { x: 1.36, y: 0.72, z: 0.38 },
    tailLamps: [[-1.46, 0.72, 0.62]],
    bumpers: [
      { x: 1.74, y: 0.36, w: 1.2 },
      { x: -1.66, y: 0.38, w: 1.2 },
    ],
    plates: [{ x: 1.78, y: 0.47, facing: 1 }],
    tank: { x: -1.18, y: 0.74, d: 0.26, h: 0.42, w: 0.95 },
    spare: { pos: [-1.44, 0.68, 0], rot: [0, -Math.PI / 2, 0] },
    hotspots: [
      { label: 'Octagon badge', p: [1.34, 1.02, 0], n: [1, 0.2, 0] },
      { label: 'Louvred bonnet', p: [0.7, 0.78, 0.33], n: [0, 0, 1] },
      { label: 'Slab tank & spare', p: [-1.48, 0.95, 0], n: [-1, 0.2, 0] },
    ],
  },

  morgan: {
    id: 'morgan',
    length: 3.6,
    paint: 0x4c0a16,
    paintOpts: { rough: 0.22, metal: 0.35 },
    leather: 0xb08a5a,
    plate: 'RR · 1955',
    R: 0.32,
    tyreH: 0.11,
    tyreW: 0.14,
    wb: 2.44,
    track: 1.3,
    frameY: 0.27,
    wheel: { type: 'disc', disc: 'chrome', rim: 'chrome', ribs: 28 },
    radiator: { kind: 'arch', x: 1.38, yb: 0.36, h: 0.5, w: 0.42, d: 0.1, slats: 15, curve: 0.07, rake: 0.08 },
    bonnet: { xf: 1.27, yf: 0.41, xr: 0.1, yb: 0.45, h: 0.4, w: 0.6, r: 0.13, crown: 0.025, louvers: { n: 16, x0: 1.02, x1: 0.34, y0: 0.56, y1: 0.76 } },
    tub: {
      w: 1.08,
      shape: [['M', 0.1, 0.3], ['L', 0.1, 0.86], ['Q', 0.02, 0.92, -0.08, 0.86], ['L', -0.1, 0.55], ['L', -0.95, 0.55], ['L', -0.97, 0.84], ['Q', -1.18, 0.88, -1.46, 0.62], ['Q', -1.64, 0.45, -1.56, 0.32], ['L', -1.3, 0.3], ['L', 0.1, 0.3]],
      wall: [['M', -0.08, 0.5], ['L', -0.08, 0.88], ['Q', -0.2, 0.76, -0.36, 0.74], ['L', -0.84, 0.74], ['Q', -0.95, 0.76, -0.97, 0.84], ['L', -0.97, 0.5], ['L', -0.08, 0.5]],
      roll: [[-0.09, 0.87], [-0.2, 0.765], [-0.6, 0.745], [-0.86, 0.76], [-0.96, 0.84]],
      floor: { x0: -0.1, x1: -0.95, y: 0.55 },
    },
    dash: { x: -0.11, y: 0.78, h: 0.13, wood: true, dials: [[0.18, 0.04], [-0.02, 0.03], [-0.2, 0.04]] },
    seats: [
      { x: -0.52, y: 0.55, w: 0.44, d: 0.46, back: 0.36, tilt: 0.24, z: 0.25, pleats: 5 },
      { x: -0.52, y: 0.55, w: 0.44, d: 0.46, back: 0.36, tilt: 0.24, z: -0.25, pleats: 5 },
    ],
    steer: { x: -0.24, y: 0.9, z: 0.25, r: 0.19, wood: true },
    screen: { x: -0.05, y: 0.88, h: 0.3, w: 1.0, rake: 0.1, split: false },
    fenders: {
      w: 0.28,
      crown: 0.06,
      lip: 0.05,
      z: 0.65,
      paths: [[[1.64, 0.27], ...arc(1.22, 0.32, 0.4, 2, 168, 26), [0.6, 0.3], [0.32, 0.25], [-0.55, 0.25], [-0.72, 0.3], ...arc(-1.22, 0.32, 0.39, 16, 176, 26), [-1.66, 0.27]]],
    },
    boardStrips: { x0: 0.28, x1: -0.5, y: 0.31 },
    lamps: [
      { x: 1.42, y: 0.68, z: 0.36, r: 0.085, main: true, stalk: [1.3, 0.56, 0.3] },
      { x: 1.46, y: 0.5, z: 0.32, r: 0.04 },
    ],
    tailLamps: [[-1.5, 0.7, 0.62]],
    plates: [{ x: 1.44, y: 0.3, facing: 1, w: 0.38 }],
    hood: { x: -1.02, y: 0.86, len: 0.95, r: 0.085, color: 0xb7905f },
    spare: { pos: [-1.47, 0.66, 0], rot: [0, -Math.PI / 2, -0.75], order: 'ZYX' },
    hotspots: [
      { label: 'Waterfall grille', p: [1.4, 0.7, 0], n: [1, 0.1, 0] },
      { label: 'Ash-framed coachwork', p: [-0.5, 0.7, 0.56], n: [0, 0, 1] },
      { label: 'Sliding-pillar suspension', p: [1.22, 0.32, 0.72], n: [0.2, 0, 1] },
    ],
  },

  marry: {
    id: 'marry',
    length: 4.1,
    paint: 0x3d0913,
    paintOpts: { rough: 0.2, metal: 0.5 },
    leather: 0xc9a77b,
    plate: 'JUST MARRIED',
    R: 0.36,
    tyreH: 0.12,
    tyreW: 0.16,
    wb: 2.85,
    track: 1.46,
    frameY: 0.34,
    wheel: { type: 'wire', spokes: 48, rim: 'chrome', spoke: 'chrome' },
    radiator: { kind: 'slats', x: 1.62, yb: 0.44, h: 0.62, w: 0.54, d: 0.14, t: 0.05, rake: 0.06, slats: 16, mascot: 'wings' },
    bonnet: { xf: 1.49, xr: 0.25, yb: 0.55, h: 0.48, w: 0.7, r: 0.1, crown: 0.02, strip: { x0: 1.4, x1: 0.3, y: 0.92 } },
    tub: {
      w: 1.24,
      shape: [['M', 0.25, 0.4], ['L', 0.25, 1.03], ['Q', 0.15, 1.08, 0.05, 1.03], ['L', 0.02, 0.62], ['L', -1.05, 0.62], ['L', -1.07, 0.98], ['Q', -1.5, 1.03, -1.63, 0.8], ['Q', -1.69, 0.55, -1.55, 0.42], ['L', -1.2, 0.4], ['L', 0.25, 0.4]],
      wall: [['M', 0.04, 0.58], ['L', 0.04, 1.04], ['Q', -0.1, 0.92, -0.3, 0.9], ['L', -0.9, 0.9], ['Q', -1.02, 0.92, -1.07, 0.98], ['L', -1.07, 0.58], ['L', 0.04, 0.58]],
      roll: [[0.03, 1.03], [-0.1, 0.925], [-0.6, 0.905], [-0.92, 0.91], [-1.06, 0.98]],
      floor: { x0: 0.0, x1: -1.04, y: 0.62 },
    },
    dash: { x: 0.0, y: 0.94, h: 0.15, wood: true, dials: [[0.25, 0.045], [0.08, 0.03], [-0.08, 0.03], [-0.25, 0.045]] },
    seats: [{ x: -0.55, y: 0.62, w: 1.1, d: 0.5, back: 0.42, tilt: 0.2 }],
    steer: { x: -0.12, y: 1.07, z: 0.28, r: 0.2, wood: true },
    screen: { x: 0.14, y: 1.05, h: 0.34, w: 1.12, rake: 0.1, split: true },
    fenders: {
      w: 0.3,
      crown: 0.06,
      lip: 0.07,
      z: 0.73,
      paths: [[[1.9, 0.32], ...arc(1.425, 0.36, 0.44, 2, 168, 26), [0.8, 0.36], [0.55, 0.315], [-0.74, 0.315], [-0.88, 0.37], ...arc(-1.425, 0.36, 0.43, 16, 176, 26), [-1.92, 0.31]]],
    },
    boardStrips: { x0: 0.5, x1: -0.7, y: 0.375 },
    lamps: [
      { x: 1.74, y: 0.86, z: 0.48, r: 0.11, main: true, stalk: [1.6, 0.6, 0.62] },
      { x: 1.77, y: 0.84, z: 0.26, r: 0.085, main: true },
      { x: 1.9, y: 0.56, z: 0.3, r: 0.055 },
    ],
    lampBar: { x: 1.74, y: 0.72, z: 0.5 },
    tailLamps: [[-1.72, 0.78, 0.72]],
    bumpers: [
      { x: 2.0, y: 0.4, w: 1.3 },
      { x: -2.0, y: 0.42, w: 1.2 },
    ],
    plates: [{ x: 2.02, y: 0.3, facing: 1, w: 0.5 }],
    spare: { pos: [-1.82, 0.82, 0], rot: [0, -Math.PI / 2, 0] },
    exhaust: true,
    ribbon: { from: [1.56, 1.1, 0], to: [0.2, 1.08, 0.52] },
    hotspots: [
      { label: 'Quad chrome headlamps', p: [1.82, 0.9, 0.48], n: [1, 0, 0.3] },
      { label: 'Flexible side exhausts', p: [0.8, 0.62, 0.62], n: [0, 0.2, 1] },
      { label: 'Chrome wire wheels', p: [-1.425, 0.36, 0.84], n: [0, 0, 1] },
    ],
  },
}

export const CAR_IDS = ['rolls-royce', 'mg', 'morgan', 'marry']
export function buildCar(id) {
  return buildVintage(SPECS[id])
}
