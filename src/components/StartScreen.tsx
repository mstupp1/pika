import React from 'react';
import { Canvas } from '@react-three/fiber';
import { CustomCursor } from './CustomCursor';
import { Pokemon } from './Pokemon';
import { Environment } from '@react-three/drei';

interface StartScreenProps {
  onStart: () => void;
}

function BackgroundPikachu() {
  return (
    <group position={[0, -1.5, -2]} rotation={[0.1, 0, 0]} scale={2}>
      <Pokemon position={[0, 0, 0]} gameState="start" score={0} />
    </group>
  );
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="menu-background">
        <Canvas camera={{ position: [0, 0.5, 2], fov: 50 }}>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <BackgroundPikachu />
          <Environment preset="sunset" />
          <fog attach="fog" args={['#000', 1, 5]} />
        </Canvas>
      </div>
      <div className="menu-content">
        <CustomCursor />
        <h1>Pikachu's Berry Rush</h1>
        <button onClick={onStart}>Start Game</button>
      </div>
    </div>
  );
} 