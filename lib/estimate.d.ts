export type LocationEstimate = {
  label: string;
  depth: string;
  kind: 'known' | 'custom' | 'empty';
};

export function estimateByLocation(value: string): LocationEstimate;
export const popularLocations: string[];
