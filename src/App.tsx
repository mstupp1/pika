import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats, StatsGl } from '@react-three/drei';
import { Pokemon } from './components/Pokemon';
import { Forest } from './components/Forest';
// import { Berry } from './components/Berry';
import { StartScreen } from './components/StartScreen';
import { CustomCursor } from './components/CustomCursor';
import { Clouds } from './components/Clouds';
import { Mountains } from './components/Mountains';
import { Perf } from 'r3f-perf';
import './styles.css';
import { useAtom, useSetAtom } from 'jotai';
import {
  gameStateAtom,
  scoreAtom,
  timeLeftAtom,
  berryPositionsAtom,
  isLoadingAtom,
  lastRainTimeAtom,
  targetBerryCountAtom,
} from './atoms/gameState';
import { Berries } from './components/berries/Berries';
import { StartScreenContainer } from './components/StartScreenContainer';
import { HUD } from './components/HUD';
import { GameOver } from './components/GameOver';
import { LoadingScreen } from './components/LoadingScreen';

import { BerryData } from './types/berries.types';
// Generate random berry position with optional height for falling berries

import generateBerryPosition from './utils/generateBerryPosition';
import { GameInitializer } from './components/GameInitializer';
import { GameTimer } from './components/GameTimer';

function App() {
  const [gameState, setGameState] = useAtom(gameStateAtom);

  const setTimeLeft = useSetAtom(timeLeftAtom);
  const collectSoundRef = useRef(new Audio('/sounds/collect.wav'));

  useEffect(() => {
    collectSoundRef.current.preload = 'auto';
    collectSoundRef.current.volume = 0.3;
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Only render after initial loading is complete

  return (
    <>
      <LoadingScreen />
      <StartScreenContainer />
      <GameInitializer />
      <GameTimer />
      <HUD />
      <GameOver />
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas shadows camera={{ position: [0, 0, 0], fov: 75, far: 50 }}>
          <color attach="background" args={['#87CEEB']} />

          <directionalLight
            castShadow
            position={[20, 30, 20]}
            intensity={1.5}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-35}
            shadow-camera-right={35}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
            shadow-camera-near={1}
            shadow-camera-far={60}
          />
          <mesh position={[20, 30, 20]}>
            <sphereGeometry args={[3, 32, 32]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.5}
              metalness={0.1}
              roughness={0.2}
            />
            <pointLight intensity={2} distance={100} decay={2} />
          </mesh>

          <ambientLight intensity={0.4} />

          <fog attach="fog" args={['#87CEEB', 18, 30]} />

          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[70, 70]} />
            <meshStandardMaterial color="#90EE90" />
          </mesh>

          {/* <Clouds /> */}
          {/* <Mountains /> */}
          <Pokemon position={[0, 0, 0]} gameState={gameState} />
          {/* <Forest /> */}
          <Suspense fallback={null}>
            <Berries />
          </Suspense>
          <Stats className="stats" showPanel={0} />
          <Perf />
        </Canvas>
      </div>
    </>
  );
}

export default App;
