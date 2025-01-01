import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, Group, Vector3, Euler, ShaderMaterial } from 'three';
import { Html } from '@react-three/drei';

interface PokemonProps {
  position: [number, number, number];
  gameState: 'start' | 'playing' | 'gameover';
  score?: number;
}

interface GameState {
  velocity: Vector3;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  currentMaxSpeed: number;
  speedBoostPerBerry: number;
  speedDecayRate: number;
  acceleration: number;
  deceleration: number;
  keysPressed: Set<string>;
  cameraAngle: number;
  mouseSensitivity: number;
  targetRotation: number;
  cameraDistance: number;
  isometricAngle: number;
  cameraHeight: number;
  cameraLookHeight: number;
  cameraDampening: number;
  rotationDampening: number;
  velocityDampening: number;
  isFlipping: boolean;
  flipProgress: number;
  flipDirection: 'left' | 'right' | 'forward' | 'backward' | null;
}

// Movement constants
const BASE_SPEED = 0.04;
const MAX_SPEED = 0.18;
const ACCELERATION = 0.004;
const DECELERATION = 0.004;
const MIN_DECELERATION = 0.002;
const SPEED_BOOST_PER_BERRY = 0.012;
const TURN_RATE = 12;
const REVERSE_TURN_RATE = 35; // Reduced from 50 for slower 180s
const REVERSE_TURN_THRESHOLD = 0.3;
const REVERSE_SPEED_REDUCTION = 0.85;
const MIN_SPEED_FOR_TURN = 0.02; // Lowered from 0.05 - can turn at lower speeds
const FLIP_RATE = 4; // How fast the 180 flip happens
const FLIP_DURATION = 0.5; // How long the flip takes in seconds

// Add zoom constants at the top with other constants
const MIN_CAMERA_DISTANCE = 5;
const MAX_CAMERA_DISTANCE = 12;
const ZOOM_SPEED = 0.5;
const INITIAL_CAMERA_DISTANCE = 6; // Starting closer
const ZOOM_OUT_PER_BERRY = 0.15; // How much to zoom out per berry
const MAX_ZOOM_OUT = 4; // Maximum additional zoom out from berries

// Add countdown camera constants
const COUNTDOWN_CAMERA_DISTANCE = 8;
const COUNTDOWN_CAMERA_HEIGHT = 3;
const COUNTDOWN_CAMERA_ANGLE = Math.PI; // Point camera behind Pikachu

// Update countdown camera constants
const GAME_CAMERA_DISTANCE = 8;
const GAME_CAMERA_HEIGHT = 5;
const GAME_CAMERA_ANGLE = Math.PI / 4; // 45 degrees

// Simplified toon shader for Pikachu's body
const pikachuBodyShader = {
  uniforms: {
    color: { value: null }
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying vec3 vNormal;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
      
      // Softer diffuse lighting with less contrast
      float diffuse = max(dot(normal, lightDir), 0.0);
      diffuse = smoothstep(0.2, 0.8, diffuse);
      
      // Increased ambient light for brighter overall appearance
      float ambient = 0.7;
      
      // Combine lighting with more emphasis on ambient
      vec3 finalColor = color * (diffuse * 0.5 + ambient);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Simplified sparkle shader for electric effects
const sparkleShader = {
  uniforms: {
    time: { value: 0 },
    color: { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      float sparkle = sin(vUv.x * 10.0 + time * 3.0) * sin(vUv.y * 10.0 + time * 2.0);
      sparkle = pow(sparkle, 2.0);
      
      float glow = 1.0 - length(vUv - 0.5) * 2.0;
      glow = max(0.0, glow);
      
      vec3 finalColor = color + vec3(1.0, 0.9, 0.5) * sparkle * 0.3;
      float alpha = (sparkle * 0.5 + glow * 0.2) * 0.7;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Create shader materials
const createPikachuMaterial = (color: string) => {
  const material = new ShaderMaterial({
    uniforms: {
      color: { value: new Vector3(...hexToRgb(color)) },
      time: { value: 0 }
    },
    vertexShader: pikachuBodyShader.vertexShader,
    fragmentShader: pikachuBodyShader.fragmentShader,
    transparent: false
  });
  return material;
};

const createSparkleMaterial = (color: string) => {
  const material = new ShaderMaterial({
    uniforms: {
      color: { value: new Vector3(...hexToRgb(color)) },
      time: { value: 0 }
    },
    vertexShader: sparkleShader.vertexShader,
    fragmentShader: sparkleShader.fragmentShader,
    transparent: true
  });
  return material;
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [1, 1, 1];
}

// Add state for multiple Pika texts
interface PikaText {
  id: number;
  opacity: number;
  yOffset: number;
}

// Add sound effect for golden berry
const goldenBerrySound = new Audio('/sounds/golden-berry.wav');
goldenBerrySound.volume = 0.2; // Lower volume to 20%

export function Pokemon({ position: initialPosition, gameState, score = 0 }: PokemonProps) {
  // Move prevScore ref inside component
  const prevScore = useRef(0);
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const { camera } = useThree();
  const [showPika, setShowPika] = useState(false);
  const [pikaTimer, setPikaTimer] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isFastRunning, setIsFastRunning] = useState(false);
  const [pikaOpacity, setPikaOpacity] = useState(1);
  
  const animationRef = useRef({
    bounce: 0,
    legRotation: 0,
    armRotation: 0,
    tailWag: 0,
    earWiggle: 0,
    electricTimer: 0,
    sparkleRotation: 0,
  });

  // Movement and camera state
  const gameStateRef = useRef<GameState>({
    velocity: new Vector3(),
    speed: 0,
    baseSpeed: 0.03,
    maxSpeed: 0.12,
    currentMaxSpeed: 0.03,
    speedBoostPerBerry: 0.002,
    speedDecayRate: 0.0003,
    acceleration: 0.002,
    deceleration: DECELERATION,
    keysPressed: new Set<string>(),
    cameraAngle: 0,
    mouseSensitivity: 0.003,
    targetRotation: 0,
    cameraDistance: INITIAL_CAMERA_DISTANCE,
    isometricAngle: Math.PI / 4.5,
    cameraHeight: 5,
    cameraLookHeight: 0.8,
    cameraDampening: 0.04,
    rotationDampening: 15,
    velocityDampening: 0.92, // Added for smoother movement
    isFlipping: false,
    flipProgress: 0,
    flipDirection: null,
  });

  // Create materials
  const bodyMaterial = useRef(createPikachuMaterial('#FFE135'));
  const sparkleMaterial = useRef(createSparkleMaterial('#FFD700'));
  
  // Update shader uniforms
  useFrame((_, delta) => {
    if (!bodyMaterial.current || !sparkleMaterial.current) return;
    
    bodyMaterial.current.uniforms.time.value += delta;
    sparkleMaterial.current.uniforms.time.value += delta;
    
    // ... rest of the existing useFrame logic ...
  });

  // Update speed limits based on score
  useEffect(() => {
    const state = gameStateRef.current;
    // Each regular berry is worth 1 point, golden berry is worth 5 points
    // So we divide the score by 5 to get the equivalent number of regular berries
    const effectiveBerryCount = Math.floor(score / 5);
    const speedBoost = Math.min(effectiveBerryCount * SPEED_BOOST_PER_BERRY, MAX_SPEED - BASE_SPEED);
    state.currentMaxSpeed = BASE_SPEED + speedBoost;
  }, [score]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const state = gameStateRef.current;
      
      // Only trigger flip if not already flipping
      if (!state.isFlipping) {
        if (key === 'q') {
          state.isFlipping = true;
          state.flipProgress = 0;
          state.flipDirection = 'left';
        } else if (key === 'e') {
          state.isFlipping = true;
          state.flipProgress = 0;
          state.flipDirection = 'right';
        } else if (key === 'r') {
          state.isFlipping = true;
          state.flipProgress = 0;
          state.flipDirection = 'forward';
        } else if (key === 'f') {
          state.isFlipping = true;
          state.flipProgress = 0;
          state.flipDirection = 'backward';
        }
      }
      
      state.keysPressed.add(key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      gameStateRef.current.keysPressed.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Update pointer lock handling
  useEffect(() => {
    if (gameState !== 'playing') {
      // Ensure pointer is unlocked and cursor is visible during menus
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      document.body.style.cursor = 'auto';
      return;
    }

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      const state = gameStateRef.current;
      // Zoom in/out based on wheel direction
      state.cameraDistance = Math.max(
        MIN_CAMERA_DISTANCE,
        Math.min(
          MAX_CAMERA_DISTANCE,
          state.cameraDistance + (event.deltaY * 0.001 * ZOOM_SPEED)
        )
      );
    };

    const lockPointer = () => {
      if (gameState === 'playing' && document.pointerLockElement !== canvas) {
        try {
          canvas.requestPointerLock();
        } catch (error) {
          console.log('Could not request pointer lock');
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      
      const state = gameStateRef.current;
      state.cameraAngle -= event.movementX * state.mouseSensitivity;
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === canvas) {
        document.body.style.cursor = 'none';
      } else {
        document.body.style.cursor = 'auto';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    const handleFocus = () => {
      if (gameState === 'playing' && !document.pointerLockElement && document.hasFocus()) {
        setTimeout(lockPointer, 100); // Small delay to ensure window has focus
      }
    };

    const handleBlur = () => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    // Lock pointer on canvas click during gameplay
    canvas.addEventListener('click', lockPointer);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Add wheel event listener
    canvas.addEventListener('wheel', handleWheel);
    
    return () => {
      canvas.removeEventListener('click', lockPointer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      document.body.style.cursor = 'auto';
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gameState]);

  // Add boundary constant at the top
  const BOUNDARY_RADIUS = 45; // Slightly smaller than mountain ring radius

  // Add countdown state with proper typing
  const [countdown, setCountdown] = useState<number | 'GO!' | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Add countdown effect with type-safe value handling
  useEffect(() => {
    if (gameState === 'playing' && !isCountingDown) {
      setIsCountingDown(true);
      
      // Start with instant black screen
      setFadeOpacity(1);
      
      // Sequence: hold black -> fade out -> wait -> start countdown
      setTimeout(() => {
        // Hold black for a moment
        setTimeout(() => {
          // Fade out to reveal scene
          setFadeOpacity(0);
          
          // Start countdown after fade completes
          setTimeout(() => {
            setCountdown(3);
            
            // Sequence of countdown numbers
            const countdownSequence: Array<{ value: number | 'GO!' | null, delay: number }> = [
              { value: 3, delay: 0 },
              { value: 2, delay: 1000 },
              { value: 1, delay: 2000 },
              { value: 'GO!', delay: 3000 },
              { value: null, delay: 4000 }
            ];

            countdownSequence.forEach(({ value, delay }) => {
              setTimeout(() => {
                setCountdown(value);
                if (value === null) {
                  setIsCountingDown(false);
                }
              }, delay);
            });
          }, 800); // Wait for fade out to complete
        }, 400); // Hold black screen
      }, 100); // Initial delay
      
    } else if (gameState !== 'playing') {
      setCountdown(null);
      setIsCountingDown(false);
      setFadeOpacity(0);
    }
  }, [gameState]);

  // Game loop
  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    const state = gameStateRef.current;

    // Use same camera position for both countdown and initial gameplay
    if (isCountingDown || countdown === 'GO!') {
      const cameraOffset = new Vector3(
        Math.sin(GAME_CAMERA_ANGLE) * GAME_CAMERA_DISTANCE,
        GAME_CAMERA_HEIGHT,
        Math.cos(GAME_CAMERA_ANGLE) * GAME_CAMERA_DISTANCE
      );

      const targetPosition = groupRef.current.position.clone().add(cameraOffset);
      camera.position.lerp(targetPosition, 0.1);
      
      const lookAtPos = groupRef.current.position.clone().add(new Vector3(0, 1, 0));
      camera.lookAt(lookAtPos);
      
      // Store this position as the initial game position
      if (countdown === 'GO!') {
        state.cameraAngle = GAME_CAMERA_ANGLE;
        state.cameraDistance = GAME_CAMERA_DISTANCE;
        state.cameraHeight = GAME_CAMERA_HEIGHT;
      }
      return;
    }

    // Rest of the game loop for normal gameplay
    if (gameState !== 'playing') return;

    const anim = animationRef.current;

    // Calculate camera-relative movement directions
    const cameraForward = new Vector3(0, 0, -1).applyEuler(new Euler(0, state.cameraAngle, 0));
    const cameraRight = new Vector3(1, 0, 0).applyEuler(new Euler(0, state.cameraAngle, 0));
    
    // Keep vectors horizontal
    cameraForward.y = 0;
    cameraRight.y = 0;
    cameraForward.normalize();
    cameraRight.normalize();

    // Calculate target movement direction
    const targetDirection = new Vector3();
    if (state.keysPressed.has('w')) targetDirection.add(cameraForward);
    if (state.keysPressed.has('s')) targetDirection.sub(cameraForward);
    if (state.keysPressed.has('d')) targetDirection.add(cameraRight);
    if (state.keysPressed.has('a')) targetDirection.sub(cameraRight);

    const moving = targetDirection.length() > 0;
    setIsMoving(moving);
    
    // Update fast running state
    setIsFastRunning(state.speed > state.currentMaxSpeed * 0.65);

    // Initialize movement direction
    const moveDirection = new Vector3();

    // Smoothly interpolate movement direction
    if (moving) {
      targetDirection.normalize();
      const targetAngle = Math.atan2(targetDirection.x, targetDirection.z);
      
      // Calculate current movement direction
      const currentDirection = state.velocity.length() > 0 
        ? state.velocity.clone().normalize()
        : targetDirection.clone();
      const currentAngle = Math.atan2(currentDirection.x, currentDirection.z);
      
      // Check if we're trying to move in (roughly) the opposite direction
      const dotProduct = currentDirection.dot(targetDirection);
      const isReversing = dotProduct < -REVERSE_TURN_THRESHOLD && state.velocity.length() > MIN_SPEED_FOR_TURN;
      
      if (isReversing) {
        // Immediate 180 turn
        const newAngle = targetAngle;
        moveDirection.set(Math.sin(newAngle), 0, Math.cos(newAngle));
        state.targetRotation = newAngle;
        // Sharp speed reduction for snappy feel
        state.speed *= REVERSE_SPEED_REDUCTION;
        // Snap character rotation
        if (groupRef.current) {
          groupRef.current.rotation.y = newAngle;
        }
      } else {
        // Normal turning
        let angleDiff = targetAngle - currentAngle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), delta * TURN_RATE);
        const newAngle = currentAngle + turnAmount;
        
        moveDirection.set(Math.sin(newAngle), 0, Math.cos(newAngle));
        state.targetRotation = newAngle;
      }
    } else {
      // When not moving, use the last velocity direction
      if (state.velocity.length() > 0) {
        moveDirection.copy(state.velocity).normalize();
      }
    }

    // Running animation
    anim.bounce = (anim.bounce + delta * (isFastRunning ? 20 : 15)) % (Math.PI * 2);
    
    if (isFastRunning) {
      // Four-legged running animation - more grounded
      bodyRef.current.position.y = 0.08 + Math.abs(Math.sin(anim.bounce)) * 0.05;
      bodyRef.current.rotation.x = -0.4 + Math.sin(anim.bounce) * 0.15;
      anim.legRotation = Math.sin(anim.bounce) * 1.4;
      anim.armRotation = Math.sin(anim.bounce + Math.PI) * 1.2;
      anim.tailWag = Math.sin(anim.bounce * 2) * 0.4;
      anim.earWiggle = Math.cos(anim.bounce * 2) * 0.3;
    } else {
      // Normal running animation - more grounded
      bodyRef.current.position.y = 0.05 + Math.abs(Math.sin(anim.bounce)) * 0.03;
      bodyRef.current.rotation.x = -0.1 + Math.sin(anim.bounce) * 0.05;
      anim.legRotation = Math.sin(anim.bounce) * 1;
      anim.armRotation = Math.sin(anim.bounce + Math.PI) * 0.7;
      anim.tailWag = Math.sin(anim.bounce * 2) * 0.3;
      anim.earWiggle = Math.cos(anim.bounce * 1.5) * 0.2;
    }

    // Electric effect and sparkle animations
    anim.electricTimer = (anim.electricTimer + delta) % 2; // Spark every 2 seconds
    anim.sparkleRotation = (anim.sparkleRotation + delta * 5) % (Math.PI * 2);

    // Character rotation
    if (moving) {
      const currentRotation = groupRef.current.rotation.y;
      const rotationDiff = Math.atan2(
        Math.sin(state.targetRotation - currentRotation),
        Math.cos(state.targetRotation - currentRotation)
      );
      groupRef.current.rotation.y += rotationDiff * delta * state.rotationDampening;
    }

    // Update speed based on movement with smoother transitions
    if (moving) {
      state.speed = Math.min(state.speed + state.acceleration * delta * 60, state.currentMaxSpeed);
    } else {
      // Dynamic deceleration - less deceleration at higher speeds, but with a minimum value
      const speedRatio = state.speed / state.currentMaxSpeed;
      const dynamicDeceleration = Math.max(
        DECELERATION * (1 - speedRatio * 0.75), // Reduces deceleration up to 75% at max speed
        MIN_DECELERATION // But never less than this value
      );
      state.speed = Math.max(state.speed - (dynamicDeceleration * (1 + state.speed * 0.5)) * delta * 60, 0);
    }

    // Apply movement with boundary check and velocity dampening
    if (state.speed > 0) {
      const moveVec = moving ? moveDirection : state.velocity.clone().normalize();
      state.velocity.copy(moveVec).multiplyScalar(state.speed);
      
      // Apply velocity dampening when not moving
      if (!moving) {
        state.velocity.multiplyScalar(state.velocityDampening);
      }
      
      // Calculate new position
      const newPosition = groupRef.current.position.clone().add(state.velocity);
      
      // Check if new position is within boundary
      const distanceFromCenter = Math.sqrt(
        newPosition.x * newPosition.x + 
        newPosition.z * newPosition.z
      );
      
      if (distanceFromCenter < BOUNDARY_RADIUS) {
        // Move freely within boundary
        groupRef.current.position.copy(newPosition);
      } else {
        // Handle boundary collision with smoother bounce
        const angle = Math.atan2(newPosition.z, newPosition.x);
        groupRef.current.position.set(
          BOUNDARY_RADIUS * Math.cos(angle),
          groupRef.current.position.y,
          BOUNDARY_RADIUS * Math.sin(angle)
        );
        state.speed *= 0.7; // Softer speed reduction on collision
      }

      setStepCount(prev => {
        const next = (prev + 1) % 300; // Much longer cycle (was 180)
        // Random chance to show Pika
        if (next === 0 && Math.random() < 0.15) { // Reduced chance from 0.3 to 0.15
          setShowPika(true);
          setPikaOpacity(1);
          // Start fade out sooner and fade faster
          setTimeout(() => {
            const fadeOut = setInterval(() => {
              setPikaOpacity(prev => {
                const newOpacity = prev - 0.1; // Faster fade (was 0.05)
                if (newOpacity <= 0) {
                  clearInterval(fadeOut);
                  setShowPika(false);
                  return 1;
                }
                return newOpacity;
              });
            }, 25); // Faster interval (was 50)
          }, 300); // Start fade sooner (was 500)
        }
        return next;
      });
    } else {
      setShowPika(false);
      setPikaOpacity(1);
    }

    // Camera follow logic
    const horizontalDistance = Math.cos(state.isometricAngle) * state.cameraDistance;
    const verticalDistance = Math.sin(state.isometricAngle) * state.cameraDistance;

    const cameraOffset = new Vector3(
      Math.sin(state.cameraAngle) * horizontalDistance,
      verticalDistance,
      Math.cos(state.cameraAngle) * horizontalDistance
    );

    const targetPosition = groupRef.current.position.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, state.cameraDampening);
    
    const lookAtPos = groupRef.current.position.clone().add(new Vector3(0, state.cameraLookHeight, 0));
    camera.lookAt(lookAtPos);

    // Handle 180-degree flips
    if (state.isFlipping) {
      state.flipProgress += delta / FLIP_DURATION;
      
      if (state.flipProgress >= 1) {
        // Complete the flip
        state.isFlipping = false;
        state.flipProgress = 0;
        
        // Apply the full 180-degree turn
        if (state.flipDirection === 'left' || state.flipDirection === 'right') {
          state.cameraAngle += Math.PI * (state.flipDirection === 'left' ? 1 : -1);
        } else {
          // For forward/backward flips, we need to handle both camera and movement
          state.cameraAngle += Math.PI * (state.flipDirection === 'forward' ? 1 : -1);
          if (state.velocity.length() > 0) {
            state.velocity.multiplyScalar(-1);
          }
        }
        state.flipDirection = null;
      } else {
        // Smooth interpolation during flip
        const flipAmount = Math.sin(state.flipProgress * Math.PI * 0.5) * Math.PI;
        
        if (state.flipDirection === 'left' || state.flipDirection === 'right') {
          state.cameraAngle = state.cameraAngle + 
            (flipAmount * FLIP_RATE * delta * (state.flipDirection === 'left' ? 1 : -1));
        } else {
          // For forward/backward flips, interpolate both camera and movement
          state.cameraAngle = state.cameraAngle + 
            (flipAmount * FLIP_RATE * delta * (state.flipDirection === 'forward' ? 1 : -1));
          
          // Also adjust body rotation for the flip animation
          if (bodyRef.current) {
            bodyRef.current.rotation.x = 
              (state.flipDirection === 'forward' ? -1 : 1) * 
              Math.sin(state.flipProgress * Math.PI) * 0.3;
          }
        }
      }
    }
  });

  // Add state for multiple Pika texts
  const [pikaTexts, setPikaTexts] = useState<PikaText[]>([]);
  let nextPikaId = useRef(0);

  // Replace the score effect with new floating text logic
  useEffect(() => {
    if (score > 0) {
      // Check if this was a golden berry (score increased by exactly 5)
      const scoreDiff = score - prevScore.current;
      const isGoldenBerry = scoreDiff === 5;
      prevScore.current = score;
      
      if (isGoldenBerry) {
        // Play golden berry sound
        goldenBerrySound.currentTime = 0;
        goldenBerrySound.play().catch(console.error);
      }

      // Add new Pika text
      const newPika = {
        id: nextPikaId.current++,
        opacity: 1,
        yOffset: 0
      };
      setPikaTexts(prev => [...prev, newPika]);

      // Animate the new text
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) { // Animation duration: 1 second
          setPikaTexts(prev => prev.map(pika => {
            if (pika.id === newPika.id) {
              return {
                ...pika,
                opacity: Math.max(0, 1 - (elapsed / 1000) * 1.5), // Fade out faster
                yOffset: (elapsed / 1000) * 2 // Float up faster
              };
            }
            return pika;
          }));
          requestAnimationFrame(animate);
        } else {
          // Remove this Pika text
          setPikaTexts(prev => prev.filter(pika => pika.id !== newPika.id));
        }
      };
      requestAnimationFrame(animate);
    }
  }, [score]);

  // Add state to track previous game state
  const prevGameStateRef = useRef<'start' | 'playing' | 'gameover'>('start');

  // Add fade state near the top with other state declarations
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Modify the reset position effect to include camera reset and fade
  useEffect(() => {
    // Only reset if transitioning from gameover/start to playing
    if (gameState === 'playing' && prevGameStateRef.current !== 'playing' && groupRef.current) {
      // Start fade in
      setFadeOpacity(1);
      
      // Reset position and movement state
      const state = gameStateRef.current;
      state.velocity.set(0, 0, 0);
      state.speed = 0;
      state.cameraAngle = 0;
      state.cameraDistance = INITIAL_CAMERA_DISTANCE;
      
      // Reset position to center
      groupRef.current.position.set(initialPosition[0], 0.05, initialPosition[2]);
      
      // Fade out after a short delay
      setTimeout(() => {
        setFadeOpacity(0);
      }, 300);
    }
    prevGameStateRef.current = gameState;
  }, [gameState, initialPosition]);

  // Update the score effect to handle camera zoom
  useEffect(() => {
    const state = gameStateRef.current;
    // Calculate zoom out amount with diminishing returns
    const zoomOutAmount = Math.min(
      MAX_ZOOM_OUT,
      Math.log(score + 1) * ZOOM_OUT_PER_BERRY
    );
    state.cameraDistance = INITIAL_CAMERA_DISTANCE + zoomOutAmount;
  }, [score]);

  return (
    <group ref={groupRef} position={[initialPosition[0], 0.05, initialPosition[2]]} name="pokemon">
      {/* Fade overlay with smoother transition */}
      <Html
        position={[0, 0, 0]}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          opacity: fadeOpacity,
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />
      {countdown !== null && (
        <Html
          position={[0, 2, 0]}
          center
          style={{
            fontSize: countdown === 'GO!' ? '120px' : '96px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            color: 'white',
            textShadow: `
              3px 3px 0 #ff0000,
              -3px -3px 0 #ff7f00,
              3px -3px 0 #ffff00,
              -3px 3px 0 #00ff00,
              0 0 15px rgba(255,255,255,0.7)
            `,
            transform: 'scale(1)',
            opacity: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: countdown === 'GO!' ? 
              'countdown-go 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 
              'countdown-number 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'none',
            zIndex: 1001,
          }}
        >
          <style>
            {`
              @keyframes countdown-number {
                0% { transform: scale(2); opacity: 0; }
                50% { transform: scale(0.8); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes countdown-go {
                0% { transform: scale(3); opacity: 0; }
                50% { transform: scale(0.9); }
                75% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
          {countdown}
        </Html>
      )}
      {pikaTexts.map(pika => (
        <Html
          key={pika.id}
          position={[0, 1.5 + pika.yOffset, 0]}
          center
          style={{
            padding: '10px 20px',
            borderRadius: '15px',
            transform: 'scale(1)',
            userSelect: 'none',
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            color: 'white',
            opacity: pika.opacity,
            textShadow: `
              2px 2px 0 #ff0000,
              -2px -2px 0 #ff7f00,
              2px -2px 0 #ffff00,
              -2px 2px 0 #00ff00,
              0 0 8px rgba(0,0,0,0.5)
            `,
            animation: 'rainbow 2s linear infinite',
            pointerEvents: 'none',
          }}
        >
          Pika!
        </Html>
      ))}
      
      <group ref={bodyRef}>
        {/* Main body - smaller blocks for more detail */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.4]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>
        {/* Body sides for more shape */}
        <mesh castShadow position={[-0.2, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.45, 0.35]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>
        <mesh castShadow position={[0.2, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.45, 0.35]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>
        
        {/* Belly - more rounded */}
        <mesh castShadow position={[0, 0.35, 0.21]}>
          <boxGeometry args={[0.4, 0.4, 0.01]} />
          <primitive object={createPikachuMaterial('#FFF4B3')} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 0.35, 0.22]}>
          <boxGeometry args={[0.35, 0.35, 0.01]} />
          <primitive object={createPikachuMaterial('#FFF4B3')} attach="material" />
        </mesh>

        {/* Head - more detailed */}
        <mesh castShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>
        {/* Head sides for more shape */}
        <mesh castShadow position={[-0.18, 0.75, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>
        <mesh castShadow position={[0.18, 0.75, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
          <primitive object={bodyMaterial.current} attach="material" />
        </mesh>

        {/* Ears - shorter and more proportional */}
        <group position={[-0.2, 1.1, 0]} rotation={[0, 0, -0.2 + animationRef.current.earWiggle]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.2, 0.08]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[0.1, 0.15, 0.08]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
        </group>
        <group position={[0.2, 1.1, 0]} rotation={[0, 0, 0.2 - animationRef.current.earWiggle]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.2, 0.08]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[0.1, 0.15, 0.08]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
        </group>

        {/* Face - smaller features */}
        <group position={[0, 0.75, 0.23]}>
          {/* Eyes */}
          <mesh position={[-0.12, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.01]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
          <mesh position={[0.12, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.01]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
          
          {/* Eye highlights */}
          <mesh position={[-0.1, 0.12, 0.01]}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
            <primitive object={createPikachuMaterial('#FFFFFF')} attach="material" />
          </mesh>
          <mesh position={[0.14, 0.12, 0.01]}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
            <primitive object={createPikachuMaterial('#FFFFFF')} attach="material" />
          </mesh>

          {/* Nose */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>

          {/* Mouth - smaller segments */}
          <mesh position={[-0.08, -0.12, 0]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
          <mesh position={[0, -0.14, 0]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
          <mesh position={[0.08, -0.12, 0]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <primitive object={createPikachuMaterial('#111111')} attach="material" />
          </mesh>
        </group>

        {/* Cheeks - smaller and more detailed */}
        <group position={[-0.22, 0.72, 0.23]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.01]} />
            <primitive object={createPikachuMaterial('#FF6B6B')} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0, 0.01]}>
            <boxGeometry args={[0.09, 0.09, 0.01]} />
            <primitive object={createPikachuMaterial('#FF5151')} attach="material" />
          </mesh>
          {animationRef.current.electricTimer < 0.3 && (
            <>
              <pointLight color="#FFD700" intensity={1.5} distance={0.6} />
              {[0, 1, 2, 3].map((i) => (
                <group key={i} rotation={[0, 0, (Math.PI * 2 * i / 4) + animationRef.current.sparkleRotation]}>
                  <mesh position={[0.12, 0, 0]}>
                    <boxGeometry args={[0.03, 0.03, 0.03]} />
                    <primitive object={sparkleMaterial.current} attach="material" />
                  </mesh>
                </group>
              ))}
            </>
          )}
        </group>
        <group position={[0.22, 0.72, 0.23]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.01]} />
            <primitive object={createPikachuMaterial('#FF6B6B')} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0, 0.01]}>
            <boxGeometry args={[0.09, 0.09, 0.01]} />
            <primitive object={createPikachuMaterial('#FF5151')} attach="material" />
          </mesh>
          {animationRef.current.electricTimer < 0.3 && (
            <>
              <pointLight color="#FFD700" intensity={1.5} distance={0.6} />
              {[0, 1, 2, 3].map((i) => (
                <group key={i} rotation={[0, 0, (Math.PI * 2 * i / 4) + animationRef.current.sparkleRotation]}>
                  <mesh position={[0.12, 0, 0]}>
                    <boxGeometry args={[0.03, 0.03, 0.03]} />
                    <primitive object={sparkleMaterial.current} attach="material" />
                  </mesh>
                </group>
              ))}
            </>
          )}
        </group>

        {/* Arms - smaller segments */}
        <group position={[-0.3, 0.45, 0]} rotation={[animationRef.current.armRotation, 0, -0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
        </group>
        <group position={[0.3, 0.45, 0]} rotation={[-animationRef.current.armRotation, 0, 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
        </group>

        {/* Legs - smaller segments */}
        <group position={[-0.2, 0.08, 0]} rotation={[isMoving ? animationRef.current.legRotation : 0, 0, isFastRunning ? -0.3 : 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.18]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
        </group>
        <group position={[0.2, 0.08, 0]} rotation={[isMoving ? -animationRef.current.legRotation : 0, 0, isFastRunning ? 0.3 : 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.18]} />
            <primitive object={bodyMaterial.current} attach="material" />
          </mesh>
        </group>

        {/* Tail - smaller segments */}
        <group position={[0, 0.4, -0.5]} rotation={[0.6 + animationRef.current.tailWag, 0, 0]}>
          {/* Base */}
          <mesh castShadow position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <primitive object={createPikachuMaterial('#964B00')} attach="material" />
          </mesh>
          {/* Middle */}
          <mesh castShadow position={[0.15, 0.25, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <primitive object={createPikachuMaterial('#964B00')} attach="material" />
          </mesh>
          {/* Upper */}
          <mesh castShadow position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <primitive object={createPikachuMaterial('#964B00')} attach="material" />
          </mesh>
          {/* Tip segments */}
          <mesh castShadow position={[0.15, 0.55, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[0.4, 0.15, 0.15]} />
            <primitive object={createPikachuMaterial('#964B00')} attach="material" />
          </mesh>
          <mesh castShadow position={[0.25, 0.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[0.2, 0.12, 0.12]} />
            <primitive object={createPikachuMaterial('#964B00')} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  );
} 