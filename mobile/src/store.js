import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKEND_URL = 'https://suyufit-backend.onrender.com';
const LS_KEY = 'suyufit_v1';

export const COLORS = {
  bg: '#000000', bg2: '#08080D', card: '#0E0E14', card2: '#17171F', line: '#25252F',
  ink: '#EFEBFA', mut: '#9A93AE', dim: '#645E78',
  gold: '#B49AFC', goldSoft: 'rgba(180,154,252,0.15)',
  pro: '#58E6B4', carb: '#6E8BFF', fat: '#E07BD6',
  ok: '#4BDCA4', warn: '#F58C7E',
};

export const MICROS = [
  { key: 'fi', n: 'Fiber', unit: 'g', goal: 32, cap: false },
  { key: 'su', n: 'Sugar', unit: 'g', goal: 35, cap: true },
  { key: 'na', n: 'Sodium', unit: 'mg', goal: 2000, cap: true },
  { key: 'kk', n: 'Potassium', unit: 'mg', goal: 3500, cap: false },
  { key: 'ca', n: 'Calcium', unit: 'mg', goal: 1000, cap: false },
  { key: 'fe', n: 'Iron', unit: 'mg', goal: 17, cap: false },
  { key: 'vc', n: 'Vitamin C', unit: 'mg', goal: 80, cap: false },
];

export const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultPlan() {
  const ex = (n, s, lo, hi, inc, ty, rest) => ({ id: uid(), n, sets: s, lo, hi, inc, ty, rest });
  return [
    { id: 'push', n: 'Push — Chest · Side Delts · Triceps', ex: [ex('Incline DB Press', 3, 6, 10, 2.5, 'c', 150), ex('Flat DB Press', 3, 8, 12, 2.5, 'c', 150), ex('Cable Fly', 2, 12, 15, 2.5, 'i', 75), ex('Cable Lateral Raise', 3, 12, 15, 1, 'i', 75), ex('Cable Pushdown', 3, 10, 12, 2.5, 'i', 75), ex('Overhead DB Extension', 2, 10, 12, 2.5, 'i', 75)] },
    { id: 'pull', n: 'Pull — Back · Rear Delts · Biceps', ex: [ex('One-Arm Lat Pulldown', 3, 8, 10, 2.5, 'c', 150), ex('Cable Seated Row', 3, 8, 12, 2.5, 'c', 150), ex('Chest-Supported DB Row', 2, 10, 12, 2.5, 'c', 150), ex('Weighted Hyperextensions', 2, 12, 15, 2.5, 'i', 90), ex('Face Pulls', 3, 12, 15, 2.5, 'i', 75), ex('EZ Bar Curl', 3, 8, 12, 2.5, 'i', 90), ex('Hammer Curl', 2, 10, 12, 1, 'i', 75)] },
    { id: 'upperm', n: 'Upper — Machine Focus', ex: [ex('Incline Chest Press Machine', 3, 8, 12, 2.5, 'c', 150), ex('Pec Deck Fly', 2, 12, 15, 2.5, 'i', 75), ex('Close-Grip Seated Cable Row', 3, 10, 12, 2.5, 'c', 150), ex('Neutral-Grip Lat Pulldown', 3, 10, 12, 2.5, 'c', 150), ex('Straight-Arm Cable Pulldown', 2, 12, 15, 2.5, 'i', 75), ex('Machine Lateral Raise', 3, 12, 15, 2.5, 'i', 75)] },
    { id: 'legs', n: 'Legs + Core', ex: [ex('Leg Press', 3, 10, 12, 5, 'c', 150), ex('Leg Extension', 3, 12, 15, 2.5, 'i', 90), ex('Seated Leg Curl', 3, 12, 15, 2.5, 'i', 90), ex('Calf Raise (standing/seated)', 3, 15, 20, 5, 'i', 75), ex('Hanging Leg Raises', 2, 10, 15, 1, 'i', 60), ex('Cable Crunch', 2, 12, 15, 2.5, 'i', 60), ex('Plank (seconds)', 2, 45, 60, 5, 'i', 60)] },
    { id: 'arms', n: 'Arms + Delts', ex: [ex('Incline DB Curl', 3, 10, 12, 1, 'i', 90), ex('Hammer Curl', 2, 10, 12, 1, 'i', 75), ex('Overhead DB Extension', 3, 10, 12, 2.5, 'i', 90), ex('Rope Pushdown', 2, 12, 15, 2.5, 'i', 75), ex('Cable Lateral Raise', 3, 12, 15, 1, 'i', 75), ex('Rear Delt Fly', 3, 12, 15, 2.5, 'i', 75)] },
  ];
}

export function freshState() {
  return {
    profile: { name: 'Suyu', sex: 'm', age: 25, h: 172, w: 70, act: 1.45, goal: 'recomp' },
    targets: null,
    foodLog: {}, customFoods: [], recents: [],
    plan: defaultPlan(),
    schedule: { Mon: 'push', Tue: 'pull', Wed: null, Thu: 'upperm', Fri: 'legs', Sat: 'arms', Sun: null },
    workLog: {}, weightLog: [], habits: {}, onboarded: false, planVer: 2,
    combos: [], measures: [], seenAch: [], goal: null,
  };
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (!s.habits) s.habits = {};
      if (!s.customFoods) s.customFoods = [];
      if (!s.combos) s.combos = [];
      if (!s.measures) s.measures = [];
      if (!s.seenAch) s.seenAch = [];
      if (s.goal === undefined) s.goal = null;
      if (s.planVer !== 2) { s.plan = defaultPlan(); s.schedule = { Mon: 'push', Tue: 'pull', Wed: null, Thu: 'upperm', Fri: 'legs', Sat: 'arms', Sun: null }; s.planVer = 2; }
      return s;
    }
  } catch (e) {}
  return null;
}

export async function saveState(S) {
  try { await AsyncStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
}

export function pad(x) { return String(x).padStart(2, '0'); }
export function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function todayKey() { return keyOf(new Date()); }
export function r0(x) { return Math.round(x); }
export function r1(x) { return Math.round(x * 10) / 10; }
export function uidGen() { return uid(); }

export function calcTargets(profile) {
  const p = profile;
  const bmr = p.sex === 'm' ? (10 * p.w + 6.25 * p.h - 5 * p.age + 5) : (10 * p.w + 6.25 * p.h - 5 * p.age - 161);
  const tdee = bmr * p.act;
  let kcal;
  if (p.goal === 'cut') kcal = tdee * 0.8;
  else if (p.goal === 'bulk') kcal = tdee * 1.1;
  else if (p.goal === 'recomp') kcal = tdee * 0.92;
  else kcal = tdee;
  const protein = p.goal === 'maintain' ? 1.6 * p.w : 2 * p.w;
  const fat = 0.8 * p.w;
  const carbs = Math.max(50, (kcal - protein * 4 - fat * 9) / 4);
  return { kcal: r0(kcal), p: r0(protein), c: r0(carbs), f: r0(fat), bmr: r0(bmr), tdee: r0(tdee) };
}

export function getTargets(S) {
  const auto = calcTargets(S.profile);
  if (S.targets) return Object.assign({}, auto, S.targets);
  return auto;
}

export function dayTotals(items) {
  const t = { k: 0, p: 0, c: 0, f: 0 };
  MICROS.forEach(m => t[m.key] = 0);
  items.forEach(it => {
    const x = it.g / 100;
    t.k += it.per.k * x; t.p += it.per.p * x; t.c += it.per.c * x; t.f += it.per.f * x;
    MICROS.forEach(m => t[m.key] += (it.per[m.key] || 0) * x);
  });
  return t;
}

export function setVol(t) { const w = +t.w || 0, r = +t.r || 0; return w > 0 ? w * r : r * 5; }

export function xpBreakdown(S) {
  let vol = 0, workouts = 0, habits = 0, foodDays = 0, proteinHits = 0, kcalHits = 0;
  const T = getTargets(S);
  for (const k in S.workLog) { const e = S.workLog[k]; if (!e || !e.entries) continue; for (const x in e.entries) vol += e.entries[x].reduce((a, t) => a + setVol(t), 0); if (e.done) workouts++; }
  for (const k in S.habits) { const hh = S.habits[k]; for (const hk in hh) { if (hk === 'water') { if (hh[hk] >= 8) habits++; } else if (hh[hk]) habits++; } }
  for (const k in S.foodLog) { const items = S.foodLog[k]; if (!items || !items.length) continue; foodDays++; const t = dayTotals(items); if (t.p >= T.p) proteinHits++; if (t.k >= T.kcal * 0.9 && t.k <= T.kcal * 1.1) kcalHits++; }
  const weighIns = S.weightLog.length;
  return { vol, workouts, habits, foodDays, proteinHits, kcalHits, weighIns, xp: Math.floor(vol / 100) + workouts * 25 + habits * 5 + foodDays * 10 + proteinHits * 15 + kcalHits * 15 + weighIns * 5 };
}

export function levelInfo(S) {
  const xp = xpBreakdown(S).xp; let L = 1;
  while (60 * L * L <= xp) L++;
  return { L, xp, cur: 60 * (L - 1) * (L - 1), next: 60 * L * L };
}
