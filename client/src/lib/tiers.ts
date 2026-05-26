export const TIERS = [
  { name: 'Starter',  min: 0,         max: 99,        color: 'rgba(255,255,255,0.45)', bar: 'rgba(255,255,255,0.2)'  },
  { name: 'Bronze',   min: 100,       max: 499,       color: '#cd7f32',                bar: '#cd7f32'                 },
  { name: 'Silver',   min: 500,       max: 1_999,     color: '#94a3b8',                bar: '#94a3b8'                 },
  { name: 'Gold',     min: 2_000,     max: 9_999,     color: '#f59e0b',                bar: '#f59e0b'                 },
  { name: 'Platinum', min: 10_000,    max: 49_999,    color: '#67e8f9',                bar: '#67e8f9'                 },
  { name: 'Diamond',  min: 50_000,    max: 199_999,   color: '#a78bfa',                bar: '#a78bfa'                 },
  { name: 'Dambler',  min: 200_000,   max: Infinity,  color: '#f43f5e',                bar: '#f43f5e'                 },
];

export function getXpTier(xp: number) {
  return TIERS.find(t => xp >= t.min && xp <= t.max) ?? TIERS[0];
}
