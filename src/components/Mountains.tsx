import React, { useMemo } from 'react';
import { Vector3 } from 'three';

interface MountainProps {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}

function Mountain({ position, scale = 1, rotation = 0 }: MountainProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Main peak */}
      <mesh castShadow receiveShadow>
        <coneGeometry args={[4, 8, 6]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      
      {/* Secondary peaks - made wider */}
      <mesh castShadow receiveShadow position={[-3, -1, 0]}>
        <coneGeometry args={[3, 6, 5]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      
      <mesh castShadow receiveShadow position={[3, -2, 1]}>
        <coneGeometry args={[3, 5, 5]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Snow caps */}
      <mesh castShadow position={[0, 4, 0]} scale={0.7}>
        <coneGeometry args={[4, 1, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function TerrainRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <ringGeometry args={[radius - 15, radius + 5, 64]} />
      <meshStandardMaterial 
        color="#4a8505" 
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
}

export function Mountains() {
  const mountains = useMemo(() => {
    const items = [];
    const radius = 45;
    const count = 24; // Reduced mountain count since we're adding terrain
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 1.5 + Math.random() * 0.4;
      
      // Add mountains with more spacing
      items.push(
        <group key={i} position={[x, -2, z]}>
          <Mountain 
            position={[0, 0, 0]} 
            scale={scale} 
            rotation={angle + Math.PI}
          />
          <Mountain 
            position={[7 + Math.random() * 3, -1, Math.random() * 4 - 2]} 
            scale={scale * 0.8} 
            rotation={angle + Math.PI + Math.random() * 0.2}
          />
        </group>
      );
    }
    return items;
  }, []);

  // Create multiple terrain rings for a fading effect
  const terrainRings = useMemo(() => {
    const rings = [];
    const baseRadius = 45;
    
    for (let i = 0; i < 3; i++) {
      rings.push(
        <TerrainRing 
          key={`ring-${i}`} 
          radius={baseRadius + i * 5} 
        />
      );
    }
    return rings;
  }, []);

  return (
    <>
      {terrainRings}
      {mountains}
    </>
  );
} 