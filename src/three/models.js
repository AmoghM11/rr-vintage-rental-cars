// Photo-derived car models (image-to-3D from the client's reference photos).
// Each GLB is normalised so the car faces +X, sits on y = 0 and has its real length.
import { THREE, glowTexture } from './kit.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

// rotY turns the raw model so its nose points along +X. Lamps are car-space headlamp centres.
export const MODEL_CFG = {
  'rolls-royce': {
    rotY: 0,
    length: 4.7,
    lamps: [[2.0, 1.05, 0.42], [2.0, 1.05, -0.42]],
    hotspots: [
      { label: 'Spirit of Ecstasy', p: [1.7, 1.55, 0], n: [0.3, 1, 0] },
      { label: 'Parthenon radiator', p: [1.85, 1.1, 0], n: [1, 0, 0] },
      { label: 'Black wire wheels', p: [-1.5, 0.45, 0.75], n: [0, 0, 1] },
    ],
  },
  mg: {
    rotY: 0,
    length: 3.7,
    lamps: [[1.55, 0.85, 0.38], [1.55, 0.85, -0.38]],
    hotspots: [
      { label: 'Upright slatted grille', p: [1.5, 0.85, 0], n: [1, 0.2, 0] },
      { label: 'Fold-flat windscreen', p: [0.1, 1.25, 0.3], n: [0.2, 1, 0.4] },
      { label: 'Tan leather cockpit', p: [-0.5, 0.95, 0], n: [0, 1, 0.3] },
    ],
  },
  morgan: {
    rotY: 0,
    length: 3.6,
    lamps: [[1.55, 0.68, 0.36], [1.55, 0.68, -0.36]],
    hotspots: [
      { label: 'Waterfall grille', p: [1.6, 0.7, 0], n: [1, 0.1, 0] },
      { label: 'Ash-framed coachwork', p: [-0.4, 0.7, 0.55], n: [0, 0, 1] },
      { label: 'Flowing wings', p: [1.0, 0.75, 0.6], n: [0.2, 0.6, 1] },
    ],
  },
  marry: {
    rotY: 0,
    length: 4.1,
    lamps: [[1.9, 0.86, 0.48], [1.9, 0.86, -0.48]],
    hotspots: [
      { label: 'Quad chrome headlamps', p: [1.9, 0.86, 0.4], n: [1, 0, 0.3] },
      { label: 'Flexible side exhausts', p: [0.7, 0.6, 0.62], n: [0, 0.2, 1] },
      { label: 'Chrome wire wheels', p: [-1.4, 0.38, 0.75], n: [0, 0, 1] },
    ],
  },
}

// Cars that use a photo-converted model instead of the hand-built one. Empty for now:
// single-photo conversions looked rougher than the hand-built cars. Add an id (and put its
// GLB in public/models/) to switch that car over.
export const PHOTO_CARS = []

let loader = null
function getLoader() {
  if (loader) return loader
  loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  return loader
}

/** Inject a noise dissolve with a glowing gold edge. reveal 0 = gone, 1 = solid. */
function addDissolve(mat, reveal, height) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = reveal
    sh.uniforms.uTop = { value: height + 0.35 }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWPos; uniform float uReveal; uniform float uTop;
        float dHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float dNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(dHash(i), dHash(i + vec3(1,0,0)), f.x), mix(dHash(i + vec3(0,1,0)), dHash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(dHash(i + vec3(0,0,1)), dHash(i + vec3(1,0,1)), f.x), mix(dHash(i + vec3(0,1,1)), dHash(i + vec3(1,1,1)), f.x), f.y), f.z); }`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float dv = vWPos.y + (dNoise(vWPos * 7.0) - 0.5) * 0.35;
        float dth = uReveal * (uTop + 0.4) - 0.2;
        if (uReveal < 0.999 && dv > dth) discard;
        float dEdge = uReveal < 0.999 ? 1.0 - smoothstep(0.0, 0.07, dth - dv) : 0.0;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * dEdge * 3.0;',
      )
  }
  mat.customProgramCacheKey = () => 'dissolve'
}

/** Smooth normals across UV seams: average by position, ignoring the seam splits. */
function smoothNormals(geo) {
  const pos = geo.attributes.position
  const idx = geo.index
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`
  const acc = new Map()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const n = new THREE.Vector3()
  const tri = idx ? idx.count : pos.count
  for (let t = 0; t < tri; t += 3) {
    const i0 = idx ? idx.getX(t) : t
    const i1 = idx ? idx.getX(t + 1) : t + 1
    const i2 = idx ? idx.getX(t + 2) : t + 2
    a.fromBufferAttribute(pos, i0)
    b.fromBufferAttribute(pos, i1)
    c.fromBufferAttribute(pos, i2)
    n.subVectors(c, b).cross(a.clone().sub(b)) // area-weighted face normal
    for (const i of [i0, i1, i2]) {
      const k = key(i)
      const v = acc.get(k)
      if (v) v.add(n)
      else acc.set(k, n.clone())
    }
  }
  const out = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const v = acc.get(key(i)).clone().normalize()
    out[i * 3] = v.x
    out[i * 3 + 1] = v.y
    out[i * 3 + 2] = v.z
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3))
}

export async function loadCar(id, url, onProgress) {
  const cfg = MODEL_CFG[id]
  const gltf = await getLoader().loadAsync(url, (e) => e.total && onProgress?.(e.loaded / e.total))
  const root = gltf.scene
  const holder = new THREE.Group()
  holder.name = id
  holder.add(root)
  holder.updateMatrixWorld(true)
  // lay the long axis along X, then apply the per-car facing correction
  let box = new THREE.Box3().setFromObject(root)
  let size = box.getSize(new THREE.Vector3())
  root.rotation.y = (size.z > size.x ? Math.PI / 2 : 0) + cfg.rotY
  holder.updateMatrixWorld(true)

  // scale to real length and seat on the floor, centred
  box = new THREE.Box3().setFromObject(root)
  size = box.getSize(new THREE.Vector3())
  root.scale.multiplyScalar(cfg.length / size.x)
  holder.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(root)
  const c = box.getCenter(new THREE.Vector3())
  root.position.x -= c.x
  root.position.z -= c.z
  root.position.y -= box.min.y
  const height = box.max.y - box.min.y

  const reveal = { value: 1 }
  root.traverse((o) => {
    if (!o.isMesh) return
    smoothNormals(o.geometry)
    const src = o.material
    // PBR output (TRELLIS.2) carries real material maps; older baked-light output gets a
    // partly emissive finish so it looks as photographed rather than re-lit.
    const pbr = !!(src.metalnessMap || src.roughnessMap)
    const mat = new THREE.MeshPhysicalMaterial({
      map: src.map,
      emissiveMap: pbr ? null : src.map,
      emissive: pbr ? 0x000000 : 0xffffff,
      emissiveIntensity: pbr ? 0 : 0.42,
      color: pbr ? 0xffffff : 0xb8b8b8,
      roughness: pbr ? 1 : 0.55,
      roughnessMap: src.roughnessMap || null,
      metalness: pbr ? 1 : 0,
      metalnessMap: src.metalnessMap || null,
      normalMap: src.normalMap || null,
      clearcoat: pbr ? 0.6 : 0.35,
      clearcoatRoughness: 0.2,
      envMapIntensity: pbr ? 1 : 0.45,
    })
    if (mat.map) {
      mat.map.colorSpace = THREE.SRGBColorSpace
      mat.map.anisotropy = 16
      mat.map.generateMipmaps = true
      mat.map.minFilter = THREE.LinearMipmapLinearFilter
    }
    addDissolve(mat, reveal, height + 0.12)
    o.material = mat
    o.castShadow = true
    o.receiveShadow = true
  })

  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xffe4b0,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  })
  const lampPoints = cfg.lamps.map((p) => new THREE.Vector3(...p))
  for (const p of lampPoints) {
    const sp = new THREE.Sprite(glowMat)
    sp.position.copy(p)
    sp.scale.setScalar(0.9)
    holder.add(sp)
  }

  holder.userData = {
    wheels: [],
    R: 1,
    glowMat,
    lens: { emissiveIntensity: 0 },
    lampPoints,
    hotspots: cfg.hotspots,
    length: cfg.length,
    reveal,
    photo: true,
  }
  return holder
}
