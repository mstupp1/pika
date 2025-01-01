import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Pokemon } from './components/Pokemon';
import { Forest } from './components/Forest';
import { Berry } from './components/Berry';
import { StartScreen } from './components/StartScreen';
import { CustomCursor } from './components/CustomCursor';
import { Clouds } from './components/Clouds';
import { Mountains } from './components/Mountains';
import './styles.css';

// Generate random berry position
const MIN_BERRY_DISTANCE = 3.5; // Reduced further to allow even more berries

// Berry spawn chances
const GOLDEN_BERRY_CHANCE = 0.35; // Reduced golden chance
const PURPLE_BERRY_CHANCE = 0.7; // Almost all non-golden berries will be purple

interface BerryData {
  position: [number, number, number];
  isGolden: boolean;
  isPurple: boolean;
  velocity?: number;
  isRaining?: boolean;
  canCollect?: boolean;
}

// Generate random berry position with optional height for falling berries
const generateBerryPosition = (
  existingPositions: BerryData[], 
  allowGolden: boolean, 
  allowPurple: boolean,
  height?: number
): BerryData | null => {
  let attempts = 0;
  while (attempts < 50) {
    const angle = Math.random() * Math.PI * 2;
    // Use square root for more even distribution
    const radius = Math.sqrt(Math.random()) * 35;
    const position: [number, number, number] = [
      Math.cos(angle) * radius,
      height ?? 0.5,
      Math.sin(angle) * radius,
    ];

    // Only check distance for ground-level berries
    const isFarEnough = height ? true : existingPositions.every(existing => {
      const dx = existing.position[0] - position[0];
      const dz = existing.position[2] - position[2];
      return Math.sqrt(dx * dx + dz * dz) >= MIN_BERRY_DISTANCE;
    });

    if (isFarEnough || existingPositions.length === 0) {
      // Completely independent chances for each berry type
      const isGolden = allowGolden && Math.random() < GOLDEN_BERRY_CHANCE;
      const isPurple = allowPurple && Math.random() < PURPLE_BERRY_CHANCE;
      return { 
        position, 
        isGolden, 
        isPurple,
        velocity: height ? 0 : undefined, // Start with 0 velocity for rain berries
        isRaining: !!height,
        canCollect: !height // Only ground berries are initially collectable
      };
    }
    attempts++;
  }
  return null;
};

function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [berryPositions, setBerryPositions] = useState<BerryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRainTime, setLastRainTime] = useState(0);
  const collectSoundRef = useRef(new Audio('/sounds/collect.wav'));

  useEffect(() => {
    collectSoundRef.current.preload = 'auto';
    collectSoundRef.current.volume = 0.3;
  }, []);

  const playCollectSound = useCallback(() => {
    try {
      const sound = collectSoundRef.current;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Ignore failed play attempts - this prevents console errors
        });
      }
    } catch (error) {
      // Ignore any audio errors
    }
  }, []);

  // Target number of berries that should be available
  const getTargetBerryCount = useCallback((timeRemaining: number) => {
    const gameProgress = (60 - timeRemaining) / 60; // 0 to 1
    // Start with 180, maintain extremely high count throughout with bigger increases
    const lateGameBonus = Math.max(0, (gameProgress - 0.3) * 100); // Even bigger bonus starting earlier
    const baseCount = 180 + Math.min(gameProgress * 60, 50); // Bigger gradual increase
    return Math.max(160, Math.floor(baseCount + lateGameBonus));
  }, []);

  // Initialize game assets and state
  useEffect(() => {
    // Wait a short moment to ensure everything is ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    
    // Generate initial berries with spacing, all regular berries at start
    const initialBerries: BerryData[] = [];
    const targetCount = getTargetBerryCount(60);
    for (let i = 0; i < targetCount; i++) {
      const berry = generateBerryPosition(initialBerries, false, false);
      if (berry) initialBerries.push(berry);
    }
    setBerryPositions(initialBerries);
  }, [getTargetBerryCount]);

  // Berry rain effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    // Update falling berries less frequently to reduce state updates
    const updateInterval = setInterval(() => {
      setBerryPositions(prev => {
        let needsUpdate = false;
        // Update positions and velocities of existing falling berries
        const updated = prev.map(berry => {
          if (!berry.isRaining) return berry;
          needsUpdate = true;
          
          const newVelocity = (berry.velocity ?? 0) - 9.8 * 0.033; // Reduced gravity for slower falls
          const newY = berry.position[1] + newVelocity * 0.033;
          
          if (newY <= 0.5) {
            // Berry has landed
            return {
              ...berry,
              position: [berry.position[0], 0.5, berry.position[2]] as [number, number, number],
              isRaining: false,
              velocity: undefined,
              canCollect: true // Make berry collectable after landing
            };
          }
          
          // Update falling berry
          return {
            ...berry,
            position: [berry.position[0], newY, berry.position[2]] as [number, number, number],
            velocity: newVelocity
          };
        });
        
        // Only update state if there are actually falling berries
        return needsUpdate ? updated : prev;
      });
    }, 33); // Update at ~30fps

    // Spawn new rain berries more frequently
    const spawnInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastRainTime < 500) return; // Minimum time between rain bursts
      
      setLastRainTime(now);
      
      setBerryPositions(prev => {
        const newBerries: BerryData[] = [];
        const gameProgress = (60 - timeLeft) / 60; // 0 to 1
        
        // More aggressive rain intensity
        const baseRainCount = 5; // Start with more berries
        const progressBonus = Math.floor(gameProgress * 15); // More bonus berries over time
        const numRainBerries = baseRainCount + progressBonus + Math.floor(Math.random() * 5); // 5-25 berries per rain
        
        for (let i = 0; i < numRainBerries; i++) {
          const berry = generateBerryPosition(
            prev.concat(newBerries), 
            true, 
            true, 
            35 + Math.random() * 10 // Random height between 35-45 units
          );
          if (berry) newBerries.push(berry);
        }
        
        return [...prev, ...newBerries];
      });
    }, 1000); // Rain every second

    return () => {
      clearInterval(updateInterval);
      clearInterval(spawnInterval);
    };
  }, [gameState, timeLeft, lastRainTime]);

  // Periodic berry spawn to maintain minimum count
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setBerryPositions(prev => {
        const targetCount = getTargetBerryCount(timeLeft);
        if (prev.length >= targetCount) return prev;

        const newBerries: BerryData[] = [];
        const deficit = targetCount - prev.length;
        const gameProgress = (60 - timeLeft) / 60; // 0 to 1
        
        // More aggressive spawning that increases over time
        const baseSpawnRate = Math.min(deficit, Math.max(15, Math.floor(deficit * 0.4)));
        const progressBonus = Math.floor(gameProgress * 10); // Reduced bonus
        const numToAdd = Math.min(deficit, baseSpawnRate + progressBonus);
        
        // Always allow special berries
        const allowGolden = true;
        const allowPurple = true;
        
        for (let i = 0; i < numToAdd; i++) {
          const berry = generateBerryPosition(prev.concat(newBerries), allowGolden, allowPurple);
          if (berry) newBerries.push(berry);
        }
        return [...prev, ...newBerries];
      });
    }, Math.max(500, 1000 - Math.floor((60 - timeLeft) * 5))); // Slower spawn frequency

    return () => clearInterval(interval);
  }, [gameState, timeLeft, getTargetBerryCount]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleCollect = useCallback((isGolden: boolean, isPurple: boolean) => {
    setScore(prev => prev + (isGolden ? 5 : isPurple ? 2 : 1));
    
    // Play collection sound
    playCollectSound();

    // Show GOLDEN text in HUD and screen flash
    if (isGolden) {
      // Create and show GOLDEN text
      const goldenText = document.createElement('div');
      goldenText.className = 'golden-text';
      goldenText.textContent = 'GOLDEN!';
      document.querySelector('.hud')?.appendChild(goldenText);
      setTimeout(() => goldenText.remove(), 1000);

      // Create and show screen flash
      const flash = document.createElement('div');
      flash.className = 'screen-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 500);
    }

    // Spawn replacement berries immediately
    setBerryPositions(prev => {
      const newBerries: BerryData[] = [];
      const targetCount = getTargetBerryCount(timeLeft);
      const currentCount = prev.length;
      const gameProgress = (60 - timeLeft) / 60; // 0 to 1
      
      // Calculate how many berries to add - much more aggressive spawning that increases over time
      const baseSpawn = Math.min(15, Math.max(8, Math.floor(targetCount - currentCount + 6)));
      const progressBonus = Math.floor(gameProgress * 10); // Up to 10 extra berries based on progress
      let numToSpawn = baseSpawn + progressBonus;
      
      // Add bonus berries based on score milestones
      if (score > 0 && score % 10 === 0) numToSpawn += 6;
      
      // Add more berries towards the end of the game
      if (timeLeft <= 20) numToSpawn += 5;
      if (timeLeft <= 10) numToSpawn += 5; // Even more in the final 10 seconds
      
      // Always allow special berries
      const allowGolden = true;
      const allowPurple = true;
      
      for (let i = 0; i < numToSpawn; i++) {
        const berry = generateBerryPosition(prev.concat(newBerries), allowGolden, allowPurple);
        if (berry) newBerries.push(berry);
      }
      return [...prev, ...newBerries];
    });
  }, [timeLeft, score, getTargetBerryCount]);

  // Only render after initial loading is complete
  if (isLoading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#87CEEB',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }} />
    );
  }

  if (gameState === 'start') {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}>
        <StartScreen onStart={startGame} />
      </div>
    );
  }

  return (
    <>
      <div className="hud">
        <div className="timer">Time: {timeLeft}s</div>
        <div className="score">Score: {score}</div>
      </div>

      {gameState === 'gameover' && (
        <div className="gameover">
          <CustomCursor />
          <h1>GAME OVER</h1>
          <h2>Final Score: {score}</h2>
          <button onClick={startGame}>Play Again</button>
        </div>
      )}

      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas
          shadows
          camera={{ position: [0, 0, 0], fov: 75, far: 50 }}
        >
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

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[70, 70]} />
            <meshStandardMaterial color="#90EE90" />
          </mesh>

          <Clouds />
          <Mountains />
          <Pokemon position={[0, 0, 0]} gameState={gameState} score={score} />
          <Forest />
          {berryPositions.map((berry, index) => (
            <Berry 
              key={`${index}-${berry.position.join(',')}`}
              position={berry.position}
              isGolden={berry.isGolden}
              isPurple={berry.isPurple}
              onCollect={() => berry.canCollect ? handleCollect(berry.isGolden, berry.isPurple) : undefined}
            />
          ))}
        </Canvas>
      </div>
    </>
  );
}

export default App; 