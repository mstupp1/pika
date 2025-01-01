import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface CloudProps {
  position: [number, number, number];
  scale?: number;
}

function Cloud({ position, scale = 1 }: CloudProps) {
  const cloudRef = React.useRef<THREE.Group>(null);
  const speed = React.useRef(Math.random() * 0.2 + 0.1);
  const rotationSpeed = React.useRef(Math.random() * 0.001);
  
  useFrame((_, delta) => {
    if (!cloudRef.current) return;
    cloudRef.current.position.x += speed.current * delta;
    cloudRef.current.rotation.y += rotationSpeed.current;
    
    // Reset position when cloud goes too far
    if (cloudRef.current.position.x > 50) {
      cloudRef.current.position.x = -50;
    }
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[1, -0.2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.8, -0.1, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial 
          color="white" 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Clouds() {
  const clouds = useMemo(() => {
    const items = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 100 - 50;
      const y = Math.random() * 5 + 15;
      const z = Math.random() * 100 - 50;
      const scale = Math.random() * 2 + 2;
      items.push(
        <Cloud 
          key={i} 
          position={[x, y, z]} 
          scale={scale}
        />
      );
    }
    return items;
  }, []);

  return <>{clouds}</>;
} 