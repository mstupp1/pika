export type BerryTypes = 'golden' | 'purple' | 'red';
export interface BerryData {
  position: [number, number, number];
  type: BerryTypes;
  velocity?: number;
  isRaining?: boolean;
  canCollect?: boolean;
}
