import * as THREE from 'three';
import { useEffect, useRef, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  berryPositionsAtom,
  scoreAtom,
  targetBerryCountAtom,
  timeLeftAtom,
} from '../../atoms/gameState';
import { Berry } from './Berry';
import { Instances, useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
// import { BerryData } from '../../types/berries.types';
import { useHandleCollect } from '../../hooks/useHandleCollect';

type GLTFResult = GLTF & {
  nodes: {
    Berry: THREE.Mesh;
  };
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial;
  };
};

export function Berries() {
  const { nodes, materials } = useGLTF('/berry.glb') as unknown as GLTFResult;
  const berriesRef = useRef<any>(null);
  const [berryPositions] = useAtom(berryPositionsAtom);
  const handleCollect = useHandleCollect();

  useEffect(() => {
    if (berriesRef.current) {
      berriesRef.current.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(),
        1000
      );
    }
  }, [berriesRef]);
  console.log(berryPositions.length);
  return (
    <Instances
      ref={berriesRef}
      count={berryPositions.length}
      geometry={nodes.Berry.geometry}
      material={materials['Material.001']}
    >
      {berryPositions.map((berry, index) => (
        <Berry
          key={`${index}-${berry.position.join(',')}`}
          position={berry.position}
          isGolden={berry.isGolden}
          isPurple={berry.isPurple}
          onCollect={() =>
            berry.canCollect
              ? handleCollect(berry.isGolden, berry.isPurple)
              : undefined
          }
        />
      ))}
    </Instances>
  );
}

useGLTF.preload('/berry.glb');
