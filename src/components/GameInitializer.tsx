import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isLoadingAtom } from '../atoms/gameState';

export const GameInitializer = () => {
  const [, setIsLoading] = useAtom(isLoadingAtom);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
