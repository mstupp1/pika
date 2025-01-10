import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  berryPositionsAtom,
  scoreAtom,
  targetBerryCountAtom,
  timeLeftAtom,
} from '../atoms/gameState';
import { BerryData } from '../types';
import generateBerryPosition from '../utils/generateBerryPosition';
import { useCollectSound } from './useCollectSound';

export const useHandleCollect = () => {
  const playCollectSound = useCollectSound();
  const setBerryPositions = useSetAtom(berryPositionsAtom);
  const setScore = useSetAtom(scoreAtom);
  const [timeLeft] = useAtom(timeLeftAtom);
  const [targetBerryCount] = useAtom(targetBerryCountAtom);

  return useCallback(
    (isGolden: boolean, isPurple: boolean) => {
      setScore((prev) => prev + (isGolden ? 5 : isPurple ? 2 : 1));
      playCollectSound();

      if (isGolden) {
        const goldenText = document.createElement('div');
        goldenText.className = 'golden-text';
        goldenText.textContent = 'GOLDEN!';
        document.querySelector('.hud')?.appendChild(goldenText);
        setTimeout(() => goldenText.remove(), 1000);

        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
      }

      setBerryPositions((prev) => {
        const newBerries: BerryData[] = [];
        const currentCount = prev.length;
        const gameProgress = (60 - timeLeft) / 60;

        const baseSpawn = Math.min(
          15,
          Math.max(8, Math.floor(targetBerryCount - currentCount + 6))
        );
        const progressBonus = Math.floor(gameProgress * 10);
        let numToSpawn = baseSpawn + progressBonus;

        if (timeLeft <= 20) numToSpawn += 5;
        if (timeLeft <= 10) numToSpawn += 5;

        for (let i = 0; i < numToSpawn; i++) {
          const berry = generateBerryPosition(
            prev.concat(newBerries),
            true,
            true
          );
          if (berry) newBerries.push(berry);
        }
        return [...prev, ...newBerries];
      });
    },
    [timeLeft, targetBerryCount, setBerryPositions, setScore, playCollectSound]
  );
};
