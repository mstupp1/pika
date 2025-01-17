import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { createBerryGeometry } from './BerryGeometry';
import { createBerryMaterial } from './BerryMaterial';

const MAX_BERRIES = 1000;

export function Berries() {
  const meshRef = useRef<any>();
  const timeRef = useRef(0);
  const lastSpawnRef = useRef(0);

  const geometry = useMemo(() => createBerryGeometry(MAX_BERRIES), []);
  const material = useMemo(() => createBerryMaterial(), []);
  // useEffect(() => {
  //   if (!meshRef.current) return;

  //   const geometry = createBerryGeometry(MAX_BERRIES);
  //   const material = createBerryMaterial();

  //   meshRef.current.geometry = geometry;
  //   meshRef.current.material = material;
  // }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update time uniforms
    // console.log(material);
    // const material = meshRef.current.material as THREE.ShaderMaterial;

    material.uniforms.time.value = state.clock.elapsedTime;
    material.uniforms.deltaTime.value = delta;

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
            (Math.random() - 0.5) * 20,
            35 + Math.random() * 10,
            (Math.random() - 0.5) * 20
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
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_BERRIES]} />
  );
}
