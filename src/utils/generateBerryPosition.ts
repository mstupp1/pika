import {
  MIN_BERRY_DISTANCE,
  GOLDEN_BERRY_CHANCE,
  PURPLE_BERRY_CHANCE,
} from '../constants';
import { BerryData } from '../types';

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
    const isFarEnough = height
      ? true
      : existingPositions.every((existing) => {
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
        canCollect: !height, // Only ground berries are initially collectable
      };
    }
    attempts++;
  }
  return null;
};
export default generateBerryPosition;
