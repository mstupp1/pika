import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { gameStateAtom, timeLeftAtom } from '../atoms/gameState';

export const GameTimer = () => {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [, setTimeLeft] = useAtom(timeLeftAtom);

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

  return null;
};
