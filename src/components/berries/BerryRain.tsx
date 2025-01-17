// import { useEffect } from 'react';
// import { useAtom, useSetAtom } from 'jotai';
// import {
//   gameStateAtom,
//   berryPositionsAtom,
//   lastRainTimeAtom,
// } from '../atoms/gameState';
// import generateBerryPosition from '../utils/generateBerryPosition';

// export const BerryRain = () => {
//   const [gameState] = useAtom(gameStateAtom);
//   const setBerryPositions = useSetAtom(berryPositionsAtom);
//   const [lastRainTime, setLastRainTime] = useAtom(lastRainTimeAtom);

//   useEffect(() => {
//     if (gameState !== 'playing') return;

//     const updateInterval = setInterval(() => {
//       setBerryPositions((prev) => {
//         let needsUpdate = false;
//         const updated = prev.map((berry) => {
//           if (!berry.isRaining) return berry;
//           needsUpdate = true;

//           const newVelocity = (berry.velocity ?? 0) - 9.8 * 0.033;
//           const newY = berry.position[1] + newVelocity * 0.033;

//           if (newY <= 0.5) {
//             return {
//               ...berry,
//               position: [berry.position[0], 0.5, berry.position[2]],
//               isRaining: false,
//               velocity: undefined,
//               canCollect: true,
//             };
//           }

//           return {
//             ...berry,
//             position: [berry.position[0], newY, berry.position[2]],
//             velocity: newVelocity,
//           };
//         });

//         return needsUpdate ? updated : prev;
//       });
//     }, 33);

//     const spawnInterval = setInterval(() => {
//       const now = Date.now();
//       if (now - lastRainTime < 500) return;

//       setLastRainTime(now);
//       setBerryPositions((prev) => {
//         const newBerries = [];
//         const numRainBerries = 5 + Math.floor(Math.random() * 5);

//         for (let i = 0; i < numRainBerries; i++) {
//           const berry = generateBerryPosition(
//             prev.concat(newBerries),
//             true,
//             true,
//             35 + Math.random() * 10
//           );
//           if (berry) newBerries.push(berry);
//         }

//         return [...prev, ...newBerries];
//       });
//     }, 1000);

//     return () => {
//       clearInterval(updateInterval);
//       clearInterval(spawnInterval);
//     };
//   }, [gameState, lastRainTime]);

//   return null;
// };
export {}