import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BerryMaterial } from './BerryMaterial';
import { useGLTF } from '@react-three/drei';

const MAX_BERRIES = 1000;

export function BerryInstances() {
  const materialRef = useRef<any>();
  const { nodes } = useGLTF('/berry.glb');

  // Create initial positions
  useEffect(() => {
    const positions = new Float32Array(MAX_BERRIES * 3);
    const berryTypes = new Float32Array(MAX_BERRIES);

    for (let i = 0; i < MAX_BERRIES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 35;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Randomly assign berry types
      const random = Math.random();
      berryTypes[i] = random > 0.95 ? 1 : random > 0.8 ? 2 : 0;
    }

    materialRef.current.uniforms.positions.value = positions;
    materialRef.current.uniforms.berryTypes.value = berryTypes;
    materialRef.current.uniforms.count.value = MAX_BERRIES;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <instancedMesh args={[nodes.Berry.geometry, null, MAX_BERRIES]}>
      <berryMaterial ref={materialRef} />
    </instancedMesh>
  );
}
