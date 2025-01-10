export interface BerryData {
  position: [number, number, number];
  isGolden: boolean;
  isPurple: boolean;
  velocity?: number;
  isRaining?: boolean;
  canCollect?: boolean;
}
