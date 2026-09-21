// Mulberry32 PRNG
export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export const DEMO_SEEDS: Record<string, number> = {
  mumbai: 17001,
  chennai: 17002,
  kolkata: 17003,
  kochi: 17004,
  visakhapatnam: 17005,
  'jawaharlal-nehru': 17006,
  paradip: 17007,
  'thunder-bay': 17008,
};
