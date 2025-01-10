import { useCallback, useRef } from 'react';

export const useCollectSound = () => {
  const collectSoundRef = useRef(new Audio('/sounds/collect.wav'));

  const playCollectSound = useCallback(() => {
    try {
      const sound = collectSoundRef.current;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Ignore failed play attempts - this prevents console errors
        });
      }
    } catch (error) {
      // Ignore any audio errors
    }
  }, []);
  return playCollectSound;
};
