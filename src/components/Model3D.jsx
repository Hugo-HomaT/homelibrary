import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float, Edges, Grid, Environment, Lightformer } from '@react-three/drei'
import { makeCanvasTexture } from '../lib/textures'

/* Matériau standard avec passage transparent du mode wireframe */
function Mat({ wire, ...props }) {
  return <meshStandardMaterial wireframe={wire} {...props} />
}

/* Rotation continue (pour les cards / autorotation) */
function Spin({ enabled = true, speed = 0.5, children }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (enabled && ref.current) ref.current.rotation.y += dt * speed
  })
  return <group ref={ref}>{children}</group>
}

/* Mode d'affichage façon DCC : 'shaded' | 'wire' | 'shadedwire'.
   Traverse n'importe quel modèle (procédural OU uploadé) et applique le mode.
   En 'shadedwire' : surface ombrée + overlay d'arêtes (LineSegments) par-dessus. */
function DisplayModeGroup({ mode = 'shaded', children }) {
  const ref = useRef()
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const overlays = []
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => {
        if (!m) return
        m.wireframe = mode === 'wire'
        m.polygonOffset = mode === 'shadedwire'
        m.polygonOffsetFactor = mode === 'shadedwire' ? 1 : 0
        m.polygonOffsetUnits = mode === 'shadedwire' ? 1 : 0
      })
      const prev = o.children.find((c) => c.userData.__wire)
      if (prev) {
        o.remove(prev)
        prev.geometry.dispose()
        prev.material.dispose()
      }
      if (mode === 'shadedwire') {
        const line = new THREE.LineSegments(
          new THREE.WireframeGeometry(o.geometry),
          new THREE.LineBasicMaterial({ color: 0xb7adff, transparent: true, opacity: 0.55, depthWrite: false })
        )
        line.userData.__wire = true
        line.raycast = () => {}
        o.add(line)
        overlays.push(line)
      }
    })
    return () => {
      overlays.forEach((l) => {
        if (l.parent) l.parent.remove(l)
        l.geometry.dispose()
        l.material.dispose()
      })
    }
  }, [mode, children])
  return <group ref={ref}>{children}</group>
}

/* ============================================================== *
 *  Modèle procédural : un group de primitives selon `kind`
 * ============================================================== */
export function ProceduralModel({ kind, palette: p, wireframe: w }) {
  switch (kind) {
    case 'crate':
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <Mat wire={w} color={p.base} roughness={0.75} metalness={0.05} />
          <Edges threshold={15} color={p.accent} />
        </mesh>
      )

    case 'barrel':
      return (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.78, 0.78, 1.6, 28]} />
            <Mat wire={w} color={p.base} roughness={0.6} metalness={0.1} />
          </mesh>
          {[-0.5, 0, 0.5].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <cylinderGeometry args={[0.82, 0.82, 0.12, 28]} />
              <Mat wire={w} color={p.accent} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )

    case 'coin':
      return (
        <group rotation={[Math.PI / 2.1, 0, 0.3]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1, 1, 0.18, 44]} />
            <Mat wire={w} color={p.base} metalness={0.9} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.66, 0.66, 0.06, 6]} />
            <Mat wire={w} color={p.accent} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )

    case 'gem':
      return (
        <mesh castShadow>
          <octahedronGeometry args={[1.05, 0]} />
          <Mat wire={w} color={p.base} metalness={0.35} roughness={0.05} flatShading emissive={p.accent} emissiveIntensity={0.45} />
        </mesh>
      )

    case 'chest':
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[1.7, 0.95, 1.05]} />
            <Mat wire={w} color={p.base} roughness={0.7} />
            <Edges threshold={15} color={p.accent} />
          </mesh>
          <mesh castShadow position={[0, 0.36, 0]}>
            <boxGeometry args={[1.72, 0.5, 1.07]} />
            <Mat wire={w} color={p.base} roughness={0.65} />
            <Edges threshold={15} color={p.accent} />
          </mesh>
          <mesh position={[0, 0.05, 0.55]}>
            <boxGeometry args={[0.26, 0.4, 0.1]} />
            <Mat wire={w} color={p.accent} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )

    case 'sword':
      return (
        <group rotation={[0, 0, Math.PI * 0.12]}>
          <mesh castShadow position={[0, 0.85, 0]}>
            <boxGeometry args={[0.18, 1.7, 0.05]} />
            <Mat wire={w} color={p.accent} metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.02, 0]} castShadow>
            <boxGeometry args={[0.75, 0.16, 0.16]} />
            <Mat wire={w} color={p.base} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.65, 14]} />
            <Mat wire={w} color={p.base} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.76, 0]} castShadow>
            <sphereGeometry args={[0.13, 18, 18]} />
            <Mat wire={w} color={p.accent} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )

    case 'shield':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.15, 1.15, 0.2, 36]} />
            <Mat wire={w} color={p.base} roughness={0.55} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.18, 26]} />
            <Mat wire={w} color={p.accent} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[0.74, 0.07, 14, 36]} />
            <Mat wire={w} color={p.accent} metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      )

    case 'rocket':
      return (
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.5, 1.7, 28]} />
            <Mat wire={w} color={p.base} metalness={0.3} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.5, 0.75, 28]} />
            <Mat wire={w} color={p.accent} metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.15, 0.5]}>
            <sphereGeometry args={[0.18, 18, 18]} />
            <Mat wire={w} color="#bdf0ff" emissive="#3fd0ff" emissiveIntensity={0.6} roughness={0.1} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.5, -0.78, Math.sin(a) * 0.5]} rotation={[0, -a, 0]} castShadow>
                <boxGeometry args={[0.06, 0.5, 0.42]} />
                <Mat wire={w} color={p.accent} metalness={0.4} roughness={0.4} />
              </mesh>
            )
          })}
        </group>
      )

    case 'tree':
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.18, 0.26, 1, 12]} />
            <Mat wire={w} color={p.accent} roughness={0.9} />
          </mesh>
          {[0, 0.42, 0.82].map((y, i) => (
            <mesh key={i} castShadow position={[0, y, 0]}>
              <coneGeometry args={[0.85 - i * 0.18, 0.72, 12]} />
              <Mat wire={w} color={p.base} roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>
      )

    case 'rock':
      return (
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1.05, 0]} />
          <Mat wire={w} color={p.base} roughness={0.95} metalness={0} flatShading />
        </mesh>
      )

    case 'planet':
      return (
        <group rotation={[0, 0, 0.25]}>
          <mesh castShadow>
            <sphereGeometry args={[1, 40, 40]} />
            <Mat wire={w} color={p.base} roughness={0.55} emissive={p.base} emissiveIntensity={0.08} />
          </mesh>
          <mesh rotation={[Math.PI / 2.3, 0, 0]}>
            <torusGeometry args={[1.55, 0.13, 2, 60]} />
            <Mat wire={w} color={p.accent} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      )

    case 'drone':
      return (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.26, 0.7]} />
            <Mat wire={w} color={p.base} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.05, 0.34]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <Mat wire={w} color={p.accent} emissive={p.accent} emissiveIntensity={0.8} roughness={0.2} />
          </mesh>
          {[45, 135, 225, 315].map((deg, i) => {
            const a = (deg * Math.PI) / 180
            const x = Math.cos(a) * 0.55
            const z = Math.sin(a) * 0.55
            return (
              <group key={i} position={[x, 0, z]}>
                <mesh position={[-x * 0.45, 0, -z * 0.45]} rotation={[0, -a, 0]} castShadow>
                  <boxGeometry args={[0.5, 0.07, 0.07]} />
                  <Mat wire={w} color={p.base} metalness={0.5} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.04, 0]}>
                  <cylinderGeometry args={[0.3, 0.3, 0.03, 24]} />
                  <Mat wire={w} color={p.accent} transparent opacity={0.45} metalness={0.2} roughness={0.4} />
                </mesh>
              </group>
            )
          })}
        </group>
      )

    case 'character':
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.42, 0.7, 8, 18]} />
            <Mat wire={w} color={p.base} roughness={0.55} />
          </mesh>
          <mesh castShadow position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.44, 26, 26]} />
            <Mat wire={w} color={p.accent} roughness={0.5} />
          </mesh>
          <mesh position={[0.16, 0.6, 0.38]}>
            <sphereGeometry args={[0.07, 14, 14]} />
            <Mat wire={w} color="#1b1b22" roughness={0.3} />
          </mesh>
          <mesh position={[-0.16, 0.6, 0.38]}>
            <sphereGeometry args={[0.07, 14, 14]} />
            <Mat wire={w} color="#1b1b22" roughness={0.3} />
          </mesh>
        </group>
      )

    case 'key':
      return (
        <group rotation={[0, 0, 0.2]}>
          <mesh castShadow position={[-0.55, 0, 0]}>
            <torusGeometry args={[0.38, 0.12, 18, 30]} />
            <Mat wire={w} color={p.base} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh castShadow position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 1.25, 14]} />
            <Mat wire={w} color={p.base} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0.62, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <Mat wire={w} color={p.base} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, -0.18, 0]} castShadow>
            <boxGeometry args={[0.1, 0.22, 0.1]} />
            <Mat wire={w} color={p.base} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )

    case 'potion':
      return (
        <group>
          <mesh castShadow position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.58, 28, 28]} />
            <Mat wire={w} color="#d4ecff" transparent opacity={0.32} roughness={0.05} metalness={0} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.44, 26, 26]} />
            <Mat wire={w} color={p.base} emissive={p.accent} emissiveIntensity={0.5} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 0.42, 18]} />
            <Mat wire={w} color="#d4ecff" transparent opacity={0.32} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0.68, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 0.2, 16]} />
            <Mat wire={w} color="#8a5a2b" roughness={0.8} />
          </mesh>
        </group>
      )

    case 'car':
      return (
        <group rotation={[0, Math.PI * 0.12, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.9, 0.5, 0.92]} />
            <Mat wire={w} color={p.base} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[-0.12, 0.42, 0]}>
            <boxGeometry args={[1, 0.46, 0.82]} />
            <Mat wire={w} color={p.base} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[-0.12, 0.44, 0]}>
            <boxGeometry args={[0.62, 0.3, 0.84]} />
            <Mat wire={w} color="#bdf0ff" metalness={0.1} roughness={0.1} />
          </mesh>
          {[
            [0.62, 0.48],
            [0.62, -0.48],
            [-0.62, 0.48],
            [-0.62, -0.48],
          ].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, -0.28, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.2, 22]} />
              <Mat wire={w} color={p.accent} roughness={0.8} />
            </mesh>
          ))}
        </group>
      )

    default:
      return (
        <mesh castShadow>
          <boxGeometry args={[1.3, 1.3, 1.3]} />
          <Mat wire={w} color={p.base} roughness={0.6} />
        </mesh>
      )
  }
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#ffffff', '#4a4570', 0.7]} />
      <directionalLight position={[4, 6, 4]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#9cc4ff" />
      <directionalLight position={[0, 1, 5]} intensity={0.5} color="#ffd9a0" />
    </>
  )
}

// Petite "studio HDRI" générée localement (sans réseau) : des plans émissifs
// que les surfaces métalliques peuvent réfléchir → l'or a l'air doré, pas noir.
function StudioEnv() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={2.2} position={[0, 3, 3]} scale={[8, 8, 1]} color="#ffffff" />
      <Lightformer intensity={1.1} position={[-4, 1, -2]} scale={[5, 5, 1]} color="#9cc4ff" />
      <Lightformer intensity={1.3} position={[4, 1, 2]} scale={[5, 5, 1]} color="#ffd9a0" />
      <Lightformer intensity={1} form="ring" position={[0, -2, 0]} scale={[4, 4, 1]} color="#6d5efc" />
    </Environment>
  )
}

/* ---- Canvas léger pour les cards (autorotation + flottement) ---- */
export function ModelStage({ kind, palette }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.4, 4.3], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.6}>
          <Spin speed={0.6}>
            <ProceduralModel kind={kind} palette={palette} />
          </Spin>
        </Float>
        <ContactShadows position={[0, -1.25, 0]} opacity={0.4} scale={6} blur={2.4} far={3} resolution={256} />
      </Suspense>
    </Canvas>
  )
}

/* ---- Canvas complet pour la modale (orbite, zoom, wireframe, grille) ---- */
export function ModelViewer({ kind, palette, mode, autoRotate }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.6, 1.8, 3.4], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0e0d16']} />
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <DisplayModeGroup mode={mode}>
          <ProceduralModel kind={kind} palette={palette} />
        </DisplayModeGroup>
        <ContactShadows position={[0, -1.35, 0]} opacity={0.55} scale={8} blur={2.5} far={4} resolution={512} />
        <Grid
          position={[0, -1.36, 0]}
          args={[16, 16]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#2a2840"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#4b3ff0"
          fadeDistance={18}
          fadeStrength={1.5}
          infiniteGrid
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.6}
        minDistance={2.2}
        maxDistance={8}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}

/* ---- Aperçu d'une texture mappée sur une primitive 3D ---- */
function TexturedMesh({ pattern, palette, seed, shape }) {
  const tex = useMemo(() => {
    const t = makeCanvasTexture(pattern, palette, seed)
    t.repeat.set(shape === 'plane' ? 2 : 2, 2)
    return t
  }, [pattern, palette, seed, shape])

  const geom =
    shape === 'box' ? (
      <boxGeometry args={[1.6, 1.6, 1.6]} />
    ) : shape === 'cylinder' ? (
      <cylinderGeometry args={[1, 1, 1.8, 40]} />
    ) : (
      <sphereGeometry args={[1.2, 48, 48]} />
    )

  return (
    <Spin speed={0.4}>
      <mesh castShadow>
        {geom}
        <meshStandardMaterial map={tex} roughness={0.8} metalness={0.1} />
      </mesh>
    </Spin>
  )
}

export function TextureViewer({ pattern, palette, seed, shape = 'sphere' }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 40 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0e0d16']} />
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <TexturedMesh pattern={pattern} palette={palette} seed={seed} shape={shape} />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.5} scale={7} blur={2.5} far={4} />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={7} />
    </Canvas>
  )
}

/* ============================================================== *
 *  UPLOADED ASSETS — vrais fichiers parsés par three.js
 * ============================================================== */

// Clone l'objet uploadé, le recentre/redimensionne pour tenir dans la vue,
// et applique le wireframe sur des matériaux clonés (sans polluer l'original).
function FitObject({ object }) {
  const cloned = useMemo(() => {
    const c = object.clone(true)
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        // matériaux clonés → le mode d'affichage ne pollue pas l'original
        if (Array.isArray(o.material)) o.material = o.material.map((m) => m && m.clone())
        else if (o.material) o.material = o.material.clone()
      }
    })
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    c.scale.setScalar(2.4 / maxDim)
    const box2 = new THREE.Box3().setFromObject(c)
    const ctr = box2.getCenter(new THREE.Vector3())
    c.position.set(-ctr.x, -ctr.y, -ctr.z)
    return c
  }, [object])

  return <primitive object={cloned} />
}

export function UploadedModelStage({ object }) {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.4, 4.3], fov: 38 }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%' }}>
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <Float speed={2} rotationIntensity={0.25} floatIntensity={0.5}>
          <Spin speed={0.6}>
            <FitObject object={object} />
          </Spin>
        </Float>
        <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={6} blur={2.4} far={3} resolution={256} />
      </Suspense>
    </Canvas>
  )
}

export function UploadedModelViewer({ object, mode, autoRotate }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [2.6, 1.8, 3.4], fov: 42 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0e0d16']} />
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <DisplayModeGroup mode={mode}>
          <FitObject object={object} />
        </DisplayModeGroup>
        <ContactShadows position={[0, -1.4, 0]} opacity={0.55} scale={8} blur={2.5} far={4} resolution={512} />
        <Grid
          position={[0, -1.41, 0]}
          args={[16, 16]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#2a2840"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#4b3ff0"
          fadeDistance={18}
          fadeStrength={1.5}
          infiniteGrid
        />
      </Suspense>
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={1.6} minDistance={2} maxDistance={10} />
    </Canvas>
  )
}

function UploadedTexturedMesh({ url, shape }) {
  const tex = useLoader(THREE.TextureLoader, url)
  useMemo(() => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
  }, [tex])

  const geom =
    shape === 'box' ? (
      <boxGeometry args={[1.6, 1.6, 1.6]} />
    ) : shape === 'cylinder' ? (
      <cylinderGeometry args={[1, 1, 1.8, 40]} />
    ) : (
      <sphereGeometry args={[1.2, 48, 48]} />
    )

  return (
    <Spin speed={0.4}>
      <mesh castShadow>
        {geom}
        <meshStandardMaterial map={tex} roughness={0.85} metalness={0.05} />
      </mesh>
    </Spin>
  )
}

export function UploadedTextureViewer({ url, shape = 'sphere' }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 40 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0e0d16']} />
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <UploadedTexturedMesh url={url} shape={shape} />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.5} scale={7} blur={2.5} far={4} />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={7} />
    </Canvas>
  )
}

/* ============================================================== *
 *  THUMBNAILS — rendu hors-écran, un seul <Canvas> partagé.
 *  On rend chaque modèle UNE fois, on capture le PNG (toDataURL),
 *  puis on passe au suivant. Les cards affichent alors une vraie
 *  visu 3D au repos, sans monter de WebGL (donc sans saturer la
 *  limite de contextes du navigateur — voir le hover dans AssetCard).
 * ============================================================== */

// Ratio ≈ celui de .preview (1 / 0.88) pour que le cadrage colle au survol.
const THUMB_W = 320
const THUMB_H = 282

// Capture le contenu du canvas après quelques frames (le temps que
// l'Environment + le modèle soient bien posés), puis prévient une seule fois.
function Capturer({ onShot }) {
  const gl = useThree((s) => s.gl)
  const frame = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    frame.current += 1
    if (frame.current < 5) return // laisse l'env (PMREM) + le modèle se stabiliser
    done.current = true
    let url = null
    try {
      url = gl.domElement.toDataURL('image/png')
    } catch {
      url = null // contexte perdu / canvas indisponible → fallback emoji côté card
    }
    onShot(url)
  })
  return null
}

// Pose statique, cadrage identique au survol mais sans rotation continue.
// Léger 3/4 (rotation Y) pour que la lecture soit bien "3D".
function ThumbScene({ job }) {
  return (
    <>
      <Lights />
      <Suspense fallback={null}>
        <StudioEnv />
        <group rotation={[0, -0.5, 0]}>
          {job.uploaded ? (
            <FitObject object={job.object3d} />
          ) : (
            <ProceduralModel kind={job.kind} palette={job.palette} />
          )}
        </group>
        <ContactShadows position={[0, -1.25, 0]} opacity={0.4} scale={6} blur={2.4} far={3} resolution={256} />
      </Suspense>
    </>
  )
}

// Rend toujours la tête de file (jobs[0]). Quand elle est capturée, App la
// retire de la liste → la tête avance → re-render → capture du suivant.
// Robuste aux ajouts (uploads) en cours de route. Liste vide → démonté → contexte libéré.
export function ThumbnailFactory({ jobs, onCapture }) {
  const job = jobs[0]
  if (!job) return null
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', left: -9999, top: 0, width: THUMB_W, height: THUMB_H, opacity: 0, pointerEvents: 'none' }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 4.3], fov: 38 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* key={job.id} → remonte la scène ET le Capturer à chaque nouveau job */}
        <group key={job.id}>
          <ThumbScene job={job} />
          <Capturer onShot={(url) => onCapture(job.id, url)} />
        </group>
      </Canvas>
    </div>
  )
}
