import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBerryGeometry } from './BerryGeometry';
import { useBerryMaterial } from './BerryMaterial';

const MAX_BERRIES = 100000;

export function Berries() {
  const meshRef = useRef<any>();
  const timeRef = useRef(0);
  const lastSpawnRef = useRef(0);

  const geometry = useBerryGeometry(MAX_BERRIES);
  const material = useBerryMaterial();
  // useEffect(() => {
  //   if (!meshRef.current) return;

  //   const geometry = createBerryGeometry(MAX_BERRIES);
  //   const material = createBerryMaterial();

  //   meshRef.current.geometry = geometry;
  //   meshRef.current.material = material;
  // }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    material.uniforms.time.value = state.clock.elapsedTime;
    material.uniforms.deltaTime.value = delta;

    // Update states based on positions
    const positions = meshRef.current.geometry.getAttribute('instancePosition');
    const states = meshRef.current.geometry.getAttribute('instanceState');
    const velocities =
      meshRef.current.geometry.getAttribute('instanceVelocity');

    // Update velocities and check for landing
    for (let i = 0; i < MAX_BERRIES; i++) {
      if (states.getX(i) === 1) {
        // If raining
        const y = positions.getY(i);
        if (y <= 0.5) {
          states.setX(i, 2); // Set to landed state
          positions.setY(i, 0.5); // Set to ground level
          velocities.setXYZ(i, 0, 0, 0); // Reset velocity
        }
      }
    }

    positions.needsUpdate = true;
    states.needsUpdate = true;
    velocities.needsUpdate = true;

    // Spawn new berries periodically
    if (state.clock.elapsedTime - lastSpawnRef.current > 0.5) {
      const positions =
        meshRef.current.geometry.getAttribute('instancePosition');
      const states = meshRef.current.geometry.getAttribute('instanceState');
      const types = meshRef.current.geometry.getAttribute('instanceType');

      // Find inactive berry slots and spawn new ones
      for (let i = 0; i < MAX_BERRIES; i++) {
        if (states.getX(i) === 0) {
          positions.setXYZ(
            i,
            (Math.random() - 0.5) * 200,
            1,
            (Math.random() - 0.5) * 200
          );
          states.setX(i, 1); // Set to raining state
          types.setX(
            i,
            Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : 2) : 0
          );
        }
      }

      positions.needsUpdate = true;
      states.needsUpdate = true;
      types.needsUpdate = true;
      lastSpawnRef.current = state.clock.elapsedTime;
    }
  });

  return (
    <instancedMesh
      scale={0.6}
      ref={meshRef}
      args={[geometry, material, MAX_BERRIES]}
    />
  );
}
