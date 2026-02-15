import { getDistance } from "geolib";

export const calculateDistanceKm = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  const distance = getDistance(
    { latitude: coord1[1], longitude: coord1[0] },
    { latitude: coord2[1], longitude: coord2[0] }
  );

  return distance / 1000;
};
