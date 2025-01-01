import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';

interface BerryProps {
  position: [number, number, number];
  onCollect: () => void;
  isGolden?: boolean;
  isPurple?: boolean;
}

export function Berry({ position, isGolden, isPurple, onCollect }: BerryProps) {
  const berryRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const [scale] = useState(() => 0.8 + Math.random() * 0.4);

  useFrame((state) => {
    if (!berryRef.current) return;
    
    // Gentle floating animation
    berryRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    berryRef.current.rotation.y += 0.01;

    // Find Pikachu in the scene
    const pokemon = state.scene.getObjectByName('pokemon');
    if (!pokemon || collected) return;

    // Check for collection using Pikachu's position
    const distance = Math.sqrt(
      Math.pow(pokemon.position.x - position[0], 2) +
      Math.pow(pokemon.position.z - position[2], 2)
    );

    // Increased collection radius slightly and made collection more lenient
    if (distance < 1.5) {
      setCollected(true);
      onCollect();
    }
  });

  if (collected) return null;

  const getBerryColor = () => {
    if (isGolden) return '#FFD700';
    if (isPurple) return '#800080';
    return '#FF0000';
  };

  const getBerryMetalness = () => {
    if (isGolden) return 0.8;
    if (isPurple) return 0.4;
    return 0.1;
  };

  const getBerryRoughness = () => {
    if (isGolden) return 0.2;
    if (isPurple) return 0.5;
    return 0.8;
  };

  return (
    <group ref={berryRef} position={[position[0], position[1], position[2]]} scale={scale}>
      {/* Berry body */}
      <mesh castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getBerryColor()} 
          metalness={getBerryMetalness()}
          roughness={getBerryRoughness()}
        />
      </mesh>
      
      {/* Stem */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial color="#553311" />
      </mesh>
      
      {/* Leaf */}
      <group position={[0.1, 0.4, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 0.2, 0.5]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#228822" />
        </mesh>
      </group>
    </group>
  );
} 