
import { getDistance, isPointWithinRadius, getCenter } from "geolib";

/**
 * Calculate distance between two coordinates in kilometers
 * @param coord1 - [longitude, latitude] in GeoJSON format
 * @param coord2 - [longitude, latitude] in GeoJSON format
 * @returns Distance in kilometers
 */
export const calculateDistanceKm = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  const distanceInMeters = getDistance(
    { latitude: coord1[1], longitude: coord1[0] },
    { latitude: coord2[1], longitude: coord2[0] }
  );
  return parseFloat((distanceInMeters / 1000).toFixed(2)); // Round to 2 decimals
};

/**
 * Calculate distance in meters
 */
export const calculateDistanceMeters = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  return getDistance(
    { latitude: coord1[1], longitude: coord1[0] },
    { latitude: coord2[1], longitude: coord2[0] }
  );
};

/**
 * Check if a point is within a radius of another point
 * @param center - [longitude, latitude] center point
 * @param point - [longitude, latitude] point to check
 * @param radiusKm - Radius in kilometers
 */
export const isWithinRadius = (
  center: [number, number],
  point: [number, number],
  radiusKm: number
): boolean => {
  return isPointWithinRadius(
    { latitude: point[1], longitude: point[0] },
    { latitude: center[1], longitude: center[0] },
    radiusKm * 1000 // Convert km to meters
  );
};

/**
 * Calculate the center point (centroid) of multiple coordinates
 * @param coords - Array of [longitude, latitude] coordinates
 */
export const getCentroid = (coords: [number, number][]): [number, number] => {
  const points = coords.map((coord) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));

  const center = getCenter(points);

  if (!center) {
    throw new Error("Could not calculate center point");
  }

  return [center.longitude, center.latitude];
};

/**
 * Calculate detour percentage
 * @param directDistance - Direct distance between A and B
 * @param actualDistance - Actual distance traveled (with detour)
 */
export const calculateDetourPercentage = (
  directDistance: number,
  actualDistance: number
): number => {
  if (directDistance === 0) return 0;
  const detour = ((actualDistance - directDistance) / directDistance) * 100;
  return parseFloat(detour.toFixed(2));
};

/**
 * Calculate estimated travel time based on distance
 * @param distanceKm - Distance in kilometers
 * @param avgSpeedKmh - Average speed in km/h (default: 40)
 */
export const estimateTravelTime = (
  distanceKm: number,
  avgSpeedKmh: number = 40
): number => {
  const timeInHours = distanceKm / avgSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes;
};

/**
 * Calculate total route distance for multiple stops
 * @param coords - Array of [longitude, latitude] coordinates in order
 */
export const calculateRouteDistance = (coords: [number, number][]): number => {
  if (coords.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalDistance += calculateDistanceKm(coords[i], coords[i + 1]);
  }

  return parseFloat(totalDistance.toFixed(2));
};

/**
 * Find nearest point from a given location
 * @param location - [longitude, latitude] reference location
 * @param points - Array of [longitude, latitude] points to check
 */
export const findNearestPoint = (
  location: [number, number],
  points: [number, number][]
): { point: [number, number]; distance: number; index: number } | null => {
  if (points.length === 0) return null;

  let nearest = {
    point: points[0],
    distance: calculateDistanceKm(location, points[0]),
    index: 0,
  };

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistanceKm(location, points[i]);
    if (distance < nearest.distance) {
      nearest = { point: points[i], distance, index: i };
    }
  }

  return nearest;
};

/**
 * Sort points by distance from a reference location
 * @param location - [longitude, latitude] reference location
 * @param points - Array of [longitude, latitude] points to sort
 */
export const sortByDistance = (
  location: [number, number],
  points: [number, number][]
): Array<{ point: [number, number]; distance: number }> => {
  return points
    .map((point) => ({
      point,
      distance: calculateDistanceKm(location, point),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Validate coordinate format
 */
export const isValidCoordinate = (coord: [number, number]): boolean => {
  const [lng, lat] = coord;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
};