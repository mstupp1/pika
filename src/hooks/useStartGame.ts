import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import {
  gameStateAtom,
  scoreAtom,
  timeLeftAtom,
  berryPositionsAtom,
} from '../atoms/gameState';

export const useStartGame = () => {
  const setGameState = useSetAtom(gameStateAtom);
  const setScore = useSetAtom(scoreAtom);
  const setTimeLeft = useSetAtom(timeLeftAtom);
  const setBerryPositions = useSetAtom(berryPositionsAtom);

  return useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setBerryPositions([]);
  }, [setGameState, setScore, setTimeLeft, setBerryPositions]);
};
