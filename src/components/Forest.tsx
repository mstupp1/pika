import React, { useMemo } from 'react';
import { Vector3, Color } from 'three';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

function Tree({ position, scale = 1 }: TreeProps) {
  const treeColor = new Color('#2d5a27');
  const trunkColor = new Color('#4a3728');
  
  return (
    <group position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1.2]} />
        <meshStandardMaterial color={trunkColor} />
      </mesh>
      
      {/* Tree foliage layers */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color={treeColor} />
      </mesh>
      <mesh castShadow position={[0, 2, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color={treeColor} />
      </mesh>
      <mesh castShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color={treeColor} />
      </mesh>
    </group>
  );
}

function Bush({ position, scale = 1 }: TreeProps) {
  const bushColor = new Color('#3a7a33');
  
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={bushColor} />
      </mesh>
      <mesh castShadow position={[0.3, 0.1, 0.3]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={bushColor} />
      </mesh>
      <mesh castShadow position={[-0.3, 0.1, -0.2]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={bushColor} />
      </mesh>
    </group>
  );
}

export function Forest() {
  // Generate random positions for trees and bushes
  const forestElements = useMemo(() => {
    const elements = [];
    const gridSize = 40;
    const spacing = 8;
    
    // Create a grid of possible positions
    for (let x = -gridSize; x <= gridSize; x += spacing) {
      for (let z = -gridSize; z <= gridSize; z += spacing) {
        // Add some randomness to positions
        const xPos = x + (Math.random() - 0.5) * spacing;
        const zPos = z + (Math.random() - 0.5) * spacing;
        
        // Don't place trees too close to the center (player area)
        const distanceFromCenter = Math.sqrt(xPos * xPos + zPos * zPos);
        if (distanceFromCenter < 8) continue;
        
        // Don't place trees too close to mountains
        if (distanceFromCenter > 45) continue;
        
        // 60% chance for tree, 20% for bush, 20% nothing
        const rand = Math.random();
        if (rand < 0.6) {
          elements.push(
            <Tree 
              key={`tree-${xPos}-${zPos}`}
              position={[xPos, 0, zPos]}
              scale={0.8 + Math.random() * 0.4}
            />
          );
        } else if (rand < 0.8) {
          elements.push(
            <Bush 
              key={`bush-${xPos}-${zPos}`}
              position={[xPos, 0, zPos]}
              scale={0.8 + Math.random() * 0.4}
            />
          );
        }
      }
    }
    
    return elements;
  }, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a8505" />
      </mesh>
      
      {/* Forest elements */}
      {forestElements}
    </group>
  );
} 