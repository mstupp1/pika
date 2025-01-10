import { useAtom } from 'jotai';
import { isLoadingAtom } from '../atoms/gameState';

export function LoadingScreen() {
  const [isLoading] = useAtom(isLoadingAtom);

  if (!isLoading) return null;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#87CEEB',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
}
