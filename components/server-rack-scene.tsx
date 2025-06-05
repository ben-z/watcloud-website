/* eslint react/no-unknown-property: 0 */
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

function Rack({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.2
    }
  })
  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[0.8, 2, 1]} />
      <meshStandardMaterial color="#238aff" />
    </mesh>
  )
}

export default function ServerRackScene() {
  const racks = []
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      racks.push(<Rack key={`${x}-${z}`} position={[x * 1.2, 0, z * 1.2]} />)
    }
  }

  return (
    <Canvas shadows camera={{ position: [6, 5, 6], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow />
      {racks}
    </Canvas>
  )
}
