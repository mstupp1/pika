import { atom } from 'jotai';
import { BerryData } from '../types';
import { GAME_DURATION, BASE_BERRY_COUNT, MIN_BERRY_COUNT } from '../constants';

// Game state atoms
export const gameStateAtom = atom<'start' | 'playing' | 'gameover'>('playing');
export const scoreAtom = atom<number>(0);
export const timeLeftAtom = atom<number>(60);
export const berryPositionsAtom = atom<BerryData[]>([]);
export const isLoadingAtom = atom<boolean>(true);
export const lastRainTimeAtom = atom<number>(0);

// Derived atoms for complex calculations
export const gameProgressAtom = atom((get) => {
  const timeLeft = get(timeLeftAtom);
  return (60 - timeLeft) / 60;
});
// const targetBerryCountAtom = atom()
export const targetBerryCountAtom = atom((get) => {
  const timeLeft = get(timeLeftAtom);
  const gameProgress = (60 - timeLeft) / 60;
  const lateGameBonus = Math.max(0, (gameProgress - 0.3) * 100);
  const baseCount = BASE_BERRY_COUNT + Math.min(gameProgress * 60, 50);
  return Math.max(MIN_BERRY_COUNT, Math.floor(baseCount + lateGameBonus));
});
