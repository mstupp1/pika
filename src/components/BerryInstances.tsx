import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InstancedMesh, Object3D } from 'three';

interface BerryData {
  position: [number, number, number];
  isGolden: boolean;
  isPurple: boolean;
  isRaining?: boolean;
  canCollect?: boolean;
}

interface BerryInstancesProps {
  berries: BerryData[];
  onCollect: (index: number, isGolden: boolean, isPurple: boolean) => void;
}

export function BerryInstances({ berries, onCollect }: BerryInstancesProps) {
  const goldenBerryRef = useRef<InstancedMesh>(null);
  const purpleBerryRef = useRef<InstancedMesh>(null);
  const redBerryRef = useRef<InstancedMesh>(null);
  const stemMeshRef = useRef<InstancedMesh>(null);
  const leafMeshRef = useRef<InstancedMesh>(null);
  const tempObject = useRef(new Object3D());

  // Group berries by type
  const goldenBerries = berries.filter((b) => b.isGolden);
  const purpleBerries = berries.filter((b) => !b.isGolden && b.isPurple);
  const redBerries = berries.filter((b) => !b.isGolden && !b.isPurple);

  // Set up materials
  const berryMaterials = {
    golden: new THREE.MeshStandardMaterial({
      color: '#FFD700',
      metalness: 0.8,
      roughness: 0.2,
    }),
    purple: new THREE.MeshStandardMaterial({
      color: '#800080',
      metalness: 0.4,
      roughness: 0.5,
    }),
    red: new THREE.MeshStandardMaterial({
      color: '#FF0000',
      metalness: 0.1,
      roughness: 0.8,
    }),
  };

  useEffect(() => {
    if (
      !goldenBerryRef.current ||
      !purpleBerryRef.current ||
      !redBerryRef.current ||
      !stemMeshRef.current ||
      !leafMeshRef.current
    )
      return;

    // Update golden berries
    goldenBerries.forEach((berry, i) => {
      const scale = 0.8 + Math.random() * 0.4;
      tempObject.current.position.set(...berry.position);
      tempObject.current.scale.set(scale, scale, scale);
      tempObject.current.updateMatrix();
      goldenBerryRef.current?.setMatrixAt(i, tempObject.current.matrix);
    });

    // Update purple berries
    purpleBerries.forEach((berry, i) => {
      const scale = 0.8 + Math.random() * 0.4;
      tempObject.current.position.set(...berry.position);
      tempObject.current.scale.set(scale, scale, scale);
      tempObject.current.updateMatrix();
      purpleBerryRef.current?.setMatrixAt(i, tempObject.current.matrix);
    });

    // Update red berries
    redBerries.forEach((berry, i) => {
      const scale = 0.8 + Math.random() * 0.4;
      tempObject.current.position.set(...berry.position);
      tempObject.current.scale.set(scale, scale, scale);
      tempObject.current.updateMatrix();
      redBerryRef.current?.setMatrixAt(i, tempObject.current.matrix);
    });

    // Update stems and leaves for all berries
    berries.forEach((berry, i) => {
      const scale = 0.8 + Math.random() * 0.4;

      // Stem
      tempObject.current.position.set(
        berry.position[0],
        berry.position[1] + 0.35 * scale,
        berry.position[2]
      );
      tempObject.current.scale.set(scale, scale, scale);
      tempObject.current.updateMatrix();
      stemMeshRef.current?.setMatrixAt(i, tempObject.current.matrix);

      // Leaf
      tempObject.current.position.set(
        berry.position[0] + 0.1 * scale,
        berry.position[1] + 0.4 * scale,
        berry.position[2]
      );
      tempObject.current.rotation.set(0, 0, Math.PI / 4);
      tempObject.current.scale.set(scale, 0.2 * scale, 0.5 * scale);
      tempObject.current.updateMatrix();
      leafMeshRef.current?.setMatrixAt(i, tempObject.current.matrix);
    });

    goldenBerryRef.current.instanceMatrix.needsUpdate = true;
    purpleBerryRef.current.instanceMatrix.needsUpdate = true;
    redBerryRef.current.instanceMatrix.needsUpdate = true;
    stemMeshRef.current.instanceMatrix.needsUpdate = true;
    leafMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [berries, goldenBerries, purpleBerries, redBerries]);

  useFrame((state) => {
    if (
      !goldenBerryRef.current ||
      !purpleBerryRef.current ||
      !redBerryRef.current
    )
      return;

    const pokemon = state.scene.getObjectByName('pokemon');
    if (!pokemon) return;

    // Animate and check collisions for all berry types
    berries.forEach((berry, i) => {
      if (!berry.canCollect) return;

      const yOffset = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      tempObject.current.position.set(
        berry.position[0],
        berry.position[1] + yOffset,
        berry.position[2]
      );
      tempObject.current.rotation.y = state.clock.elapsedTime;
      tempObject.current.updateMatrix();

      // Update the appropriate instanced mesh based on berry type
      if (berry.isGolden) {
        const index = goldenBerries.findIndex((b) => b === berry);
        if (index !== -1)
          goldenBerryRef.current?.setMatrixAt(index, tempObject.current.matrix);
      } else if (berry.isPurple) {
        const index = purpleBerries.findIndex((b) => b === berry);
        if (index !== -1)
          purpleBerryRef.current?.setMatrixAt(index, tempObject.current.matrix);
      } else {
        const index = redBerries.findIndex((b) => b === berry);
        if (index !== -1)
          redBerryRef.current?.setMatrixAt(index, tempObject.current.matrix);
      }

      const distance = Math.sqrt(
        Math.pow(pokemon.position.x - berry.position[0], 2) +
          Math.pow(pokemon.position.z - berry.position[2], 2)
      );

      if (distance < 1.5) {
        onCollect(i, berry.isGolden, berry.isPurple);
      }
    });

    goldenBerryRef.current.instanceMatrix.needsUpdate = true;
    purpleBerryRef.current.instanceMatrix.needsUpdate = true;
    redBerryRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={goldenBerryRef}
        args={[undefined, undefined, goldenBerries.length]}
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial {...berryMaterials.golden} />
      </instancedMesh>

      <instancedMesh
        ref={purpleBerryRef}
        args={[undefined, undefined, purpleBerries.length]}
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial {...berryMaterials.purple} />
      </instancedMesh>

      <instancedMesh
        ref={redBerryRef}
        args={[undefined, undefined, redBerries.length]}
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial {...berryMaterials.red} />
      </instancedMesh>

      <instancedMesh
        ref={stemMeshRef}
        args={[undefined, undefined, berries.length]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial color="#553311" />
      </instancedMesh>

      <instancedMesh
        ref={leafMeshRef}
        args={[undefined, undefined, berries.length]}
      >
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#228822" />
      </instancedMesh>
    </>
  );
}
