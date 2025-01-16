import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  gameStateAtom,
  berryPositionsAtom,
  timeLeftAtom,
  targetBerryCountAtom,
} from '../atoms/gameState';
import generateBerryPosition from '../utils/generateBerryPosition';
import { BerryData } from '../types';

export const BerrySpawner = () => {
  const [gameState] = useAtom(gameStateAtom);
  const [timeLeft] = useAtom(timeLeftAtom);
  const setBerryPositions = useSetAtom(berryPositionsAtom);
  const [targetBerryCount] = useAtom(targetBerryCountAtom);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setBerryPositions((prev) => {
        const targetCount = targetBerryCount;
        if (prev.length >= targetCount) return prev;

        const newBerries: BerryData[] = [];
        const deficit = targetCount - prev.length;
        const gameProgress = (60 - timeLeft) / 60;

        const baseSpawnRate = Math.min(
          deficit,
          Math.max(15, Math.floor(deficit * 0.4))
        );
        const progressBonus = Math.floor(gameProgress * 10);
        const numToAdd = Math.min(deficit, baseSpawnRate + progressBonus);

        for (let i = 0; i < numToAdd; i++) {
          const berry = generateBerryPosition(
            prev.concat(newBerries),
            true,
            true
          );
          if (berry) newBerries.push(berry);
        }
        return [...prev, ...newBerries];
      });
    }, Math.max(500, 1000 - Math.floor((60 - timeLeft) * 5)));

    return () => clearInterval(interval);
  }, [gameState, timeLeft, targetBerryCount]);

  return null;
};
