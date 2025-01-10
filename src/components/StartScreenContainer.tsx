import { useAtomValue } from 'jotai';
import { gameStateAtom } from '../atoms/gameState';
import { useStartGame } from '../hooks/useStartGame';
import { StartScreen } from './StartScreen';

export function StartScreenContainer() {
  const startGame = useStartGame();
  const gameState = useAtomValue(gameStateAtom);
  if (gameState !== 'start') return null;
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}>
      <StartScreen onStart={startGame} />
    </div>
  );
}
