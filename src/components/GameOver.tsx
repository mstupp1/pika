import { useAtom, useAtomValue } from 'jotai';
import { gameStateAtom, scoreAtom } from '../atoms/gameState';
import { CustomCursor } from './CustomCursor';
import { useStartGame } from '../hooks/useStartGame';

export const GameOver = () => {
  const [score] = useAtom(scoreAtom);
  const gameState = useAtomValue(gameStateAtom);
  const startGame = useStartGame();

  if (gameState !== 'gameover') return null;

  return (
    <div className="gameover">
      <CustomCursor />
      <h1>GAME OVER</h1>
      <h2>Final Score: {score}</h2>
      <button onClick={startGame}>Play Again</button>
    </div>
  );
};
