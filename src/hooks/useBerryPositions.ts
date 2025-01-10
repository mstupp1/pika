import { useAtom, useSetAtom } from 'jotai';
import { berryPositionsAtom, timeLeftAtom } from '../atoms/gameState';
import { useCallback, useEffect } from 'react';

export function useBerryPositions(gameState: string, targetBerryCount: number) {
  const [berryPositions, setBerryPositions] = useSetAtom(berryPositionsAtom);
  const [timeLeft] = useAtom(timeLeftAtom);

  // Move all the berry-related useEffects here
  useEffect(() => {
    if (gameState !== 'playing') return;
    // ... existing berry rain effect code ...
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    // ... existing periodic berry spawn code ...
  }, [gameState, timeLeft, targetBerryCount]);

  const spawnReplacementBerries = useCallback(() => {
    setBerryPositions(() => {
      // ... existing replacement berry spawn logic ...
    });
  }, [timeLeft, targetBerryCount]);

  return { spawnReplacementBerries };
}
