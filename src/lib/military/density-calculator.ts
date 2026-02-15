/**
 * Density and surge detection for military aircraft around US bases.
 */

import type { MilitaryAircraft, USBase } from './types';

export interface BaseActivity {
  baseId: string;
  count: number;
  baseline: number;
  ratio: number;
  isSurge: boolean;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}

export function countAircraftNearBase(aircraft: MilitaryAircraft[], base: USBase, radiusKm = 120): number {
  return aircraft.filter((a) => haversineKm(a.latitude, a.longitude, base.location.lat, base.location.lng) <= radiusKm).length;
}

export function calculateBaseActivity(
  aircraft: MilitaryAircraft[],
  bases: USBase[],
  previousBaseline: Record<string, number>,
): { activity: BaseActivity[]; nextBaseline: Record<string, number> } {
  const nextBaseline: Record<string, number> = { ...previousBaseline };
  const activity: BaseActivity[] = bases.map((base) => {
    const count = countAircraftNearBase(aircraft, base);
    const prev = previousBaseline[base.id] ?? 0;
    const baseline = prev === 0 ? count : prev * 0.85 + count * 0.15;
    nextBaseline[base.id] = baseline;
    const ratio = baseline > 0 ? count / baseline : count > 0 ? 999 : 0;
    const isSurge = count >= 4 && ratio >= 1.8;
    return { baseId: base.id, count, baseline, ratio, isSurge };
  });

  return { activity, nextBaseline };
}
