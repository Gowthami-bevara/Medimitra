import { Doctor, Hospital, UserLocationState } from '../types';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(2));
}

export function getNearbyHospitalsWithLiveDistance(
  baseHospitals: Hospital[],
  userLoc: UserLocationState
): Hospital[] {
  if (userLoc.lat == null || userLoc.lng == null) {
    return baseHospitals.map((hosp) => ({
      ...hosp,
      distanceKm: 0,
    }));
  }

  const updated = baseHospitals.map((hosp) => {
    const hospLat = hosp.lat;
    const hospLng = hosp.lng;
    const dist = hospLat && hospLng
      ? calculateDistanceKm(userLoc.lat, userLoc.lng, hospLat, hospLng)
      : hosp.distanceKm;

    return {
      ...hosp,
      distanceKm: dist,
    };
  });

  return updated.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Format Google Maps directions query URL
 */
export function getDirectionsUrl(destName: string, destLat?: number, destLng?: number): string {
  if (destLat && destLng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName)}`;
}
