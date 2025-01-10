import { useAtom } from 'jotai';
import { scoreAtom, timeLeftAtom } from '../atoms/gameState';

export const HUD = () => {
  const [timeLeft] = useAtom(timeLeftAtom);
  const [score] = useAtom(scoreAtom);

  return (
    <div className="hud">
      <div className="timer">Time: {timeLeft}s</div>
      <div className="score">Score: {score}</div>
    </div>
  );
};
