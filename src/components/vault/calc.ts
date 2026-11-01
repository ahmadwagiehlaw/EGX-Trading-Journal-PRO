import type { VaultSnapshot, VaultCashflow, VaultPortfolio, AssetKey, VaultMonthProfit } from './types';
import { ASSET_META, ASSET_KEYS, UNCLASSIFIED } from './types';

/* ───────── Date helpers ───────── */
export const dayNum = (d: string) => {
  if (!d) return 0;
  if (d.includes('-')) {
    const [y, m, day] = d.split('-');
    if (y && m && day) return Math.floor(Date.UTC(+y, +m - 1, +day) / 86400000);
  }
  if (d.includes('/')) {
    const p = d.split('/');
    if (p.length === 3) {
      const y = +p[2], m = +p[0], day = +p[1];
      if (y > 2000) return Math.floor(Date.UTC(y, m - 1, day) / 86400000);
    }
  }
  return 0;
};
export const numToDate = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
export const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
export const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (key: string) => `${MONTHS_AR[+key.slice(5, 7) - 1]} ${key.slice(0, 4)}`;
export const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${+day} ${MONTHS_AR[+m - 1]} ${y}`;
};
export const shortDate = (d: string) => `${+d.slice(8, 10)} ${MONTHS_EN[+d.slice(5, 7) - 1]}`;

/* ───────── Number formatting ───────── */
export const fmt = (n: number, digits = 0) =>
  (Math.abs(n) < 0.5 && digits === 0 ? 0 : n).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const fmtSigned = (n: number, digits = 0) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n), digits)}`;
export const fmtPct = (n: number, digits = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}%`;
export const fmtCompact = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? '−' : '';
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`;
  return `${s}${a.toFixed(0)}`;
};

/* ───────── Series ───────── */
export interface Point {
  date: string;
  nav: number;
  deposits: number;
  flow: number;
  profit: number;
  ret: number; // profit / deposits %
  index: number; // time-weighted growth index (starts at 1)
  dd: number; // drawdown of the index (<= 0)
  by: Record<string, number>;
}

const signed = (f: VaultCashflow) => (f.type === 'deposit' ? f.amount : -f.amount);

export function buildSeries(snaps: VaultSnapshot[], flows: VaultCashflow[], ids: string[]): Point[] {
  const sel = new Set(ids);
  const S = snaps.filter(s => sel.has(s.portfolioId)).sort((a, b) => a.date.localeCompare(b.date));
  const F = flows.filter(f => sel.has(f.portfolioId) && !f.partner);
  const dates = Array.from(new Set([...S.map(s => s.date), ...F.map(f => f.date)])).sort();
  if (!dates.length) return [];

  const firstDate = dates[0];

  // أصل رأس المال الأساسي للمحفظة: يُحسب تلقائياً وبشكل ديناميكي من إجمالي أقدم قراءة سوقية مسجلة
  let initNav = 0;
  for (const p of ids) {
    const s = S.find(x => x.portfolioId === p && x.date <= firstDate);
    if (s) {
      initNav += s.total;
    } else {
      const fInit = F.filter(x => x.portfolioId === p && x.date === firstDate);
      initNav += fInit.reduce((a, c) => a + signed(c), 0);
    }
  }
  if (initNav === 0) {
    initNav = F.filter(f => f.date === firstDate).reduce((a, c) => a + signed(c), 0);
  }

  const pts: Point[] = dates.map(d => {
    const by: Record<string, number> = {};
    let nav = 0;
    for (const p of ids) {
      let snap: VaultSnapshot | undefined;
      for (const s of S) if (s.portfolioId === p && s.date <= d) snap = s;
      let after = 0;
      for (const f of F) if (f.portfolioId === p && f.date <= d && (!snap || f.date > snap.date)) after += signed(f);
      by[p] = (snap ? snap.total : 0) + after;
      nav += by[p];
    }

    // صافي رأس المال المودع = (أقدم قيمة سوقية كأساس انطلاق) + (كل الإيداعات والسحوبات الصافية اللاحقة)
    let deposits = initNav;
    let flow = 0;
    for (const f of F) {
      if (f.date === d) flow += signed(f);
      if (d > firstDate && f.date > firstDate && f.date <= d && !f.opening) {
        deposits += signed(f);
      }
    }

    const profit = nav - deposits;
    const ret = deposits > 0 ? (profit / deposits) * 100 : 0;
    return { date: d, nav, deposits, flow, profit, ret, index: 1, dd: 0, by };
  });

  let idx = 1;
  let peak = 1;
  pts.forEach((p, i) => {
    if (i > 0) {
      const prev = pts[i - 1];
      const denom = prev.nav + p.flow * 0.5;
      const r = denom > 0 ? (p.nav - prev.nav - p.flow) / denom : 0;
      idx *= 1 + Math.max(-0.9, Math.min(10, r));
    }
    peak = Math.max(peak, idx);
    p.index = idx;
    p.dd = idx / peak - 1;
  });
  return pts;
}

export function scaleSeries(pts: Point[], f: number): Point[] {
  if (f === 1) return pts;
  return pts.map(p => ({
    ...p,
    nav: p.nav * f,
    deposits: p.deposits * f,
    flow: p.flow * f,
    profit: p.profit * f,
    by: Object.fromEntries(Object.entries(p.by).map(([k, v]) => [k, v * f])),
  }));
}

export type Period = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'All';
export const PERIODS: Period[] = ['1M', '3M', '6M', '1Y', '2Y', 'All'];
const PERIOD_DAYS: Record<Period, number> = { '1M': 30, '3M': 91, '6M': 182, '1Y': 365, '2Y': 730, All: 0 };

export interface ChartPoint extends Point {
  pProfit: number; // profit rebased to window start
  pTwr: number; // % growth rebased to window start
  pDd: number; // drawdown % inside window
}

export function windowSeries(pts: Point[], period: Period, dir: 'rtl' | 'ltr' = 'rtl'): ChartPoint[] {
  if (!pts.length) return [];
  const lastN = dayNum(pts[pts.length - 1].date);
  const cutoff = PERIOD_DAYS[period] === 0 ? -Infinity : lastN - PERIOD_DAYS[period];
  let win = pts.filter(p => dayNum(p.date) >= cutoff);
  if (!win.length) win = [pts[pts.length - 1]];
  const before = [...pts].reverse().find(p => dayNum(p.date) < cutoff);
  const base = before ?? win[0];
  let peak = 0;
  const mapped = win.map(p => {
    const rel = p.index / base.index;
    peak = Math.max(peak, rel);
    return { ...p, pProfit: p.profit - base.profit, pTwr: (rel - 1) * 100, pDd: (rel / peak - 1) * 100 };
  });

  return dir === 'rtl' ? [...mapped].reverse() : mapped;
}

/* ───────── Period returns (Modified Dietz) ───────── */
export interface PeriodRet {
  key: string;
  gain: number;
  pct: number;
  flow: number;
  startNav: number;
  endNav: number;
  points: number;
}

export function periodReturn(pts: Point[], S: string, E: string, key: string): PeriodRet | null {
  const win = pts.filter(p => p.date > S && p.date <= E);
  if (!win.length) return null;
  let startNav = 0;
  for (const p of pts) if (p.date <= S) startNav = p.nav;
  const end = win[win.length - 1];
  const total = Math.max(1, dayNum(E) - dayNum(S));
  let flow = 0;
  let wFlow = 0;
  for (const p of win) {
    flow += p.flow;
    wFlow += p.flow * Math.min(1, (dayNum(E) - dayNum(p.date) + 0.5) / total);
  }
  const gain = end.nav - startNav - flow;
  const denom = startNav + wFlow;
  return { key, gain, pct: denom > 0 ? (gain / denom) * 100 : 0, flow, startNav, endNav: end.nav, points: win.length };
}

export function monthlyReturns(pts: Point[]): PeriodRet[] {
  if (!pts.length) return [];
  const out: PeriodRet[] = [];
  let y = +pts[0].date.slice(0, 4);
  let m = +pts[0].date.slice(5, 7);
  const ly = +pts[pts.length - 1].date.slice(0, 4);
  const lm = +pts[pts.length - 1].date.slice(5, 7);
  while (y < ly || (y === ly && m <= lm)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    const S = `${py}-${String(pm).padStart(2, '0')}-${lastDayOfMonth(py, pm)}`;
    const E = `${key}-${lastDayOfMonth(y, m)}`;
    const r = periodReturn(pts, S, E, key);
    if (r) out.push(r);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

export function weeklyReturns(pts: Point[]): PeriodRet[] {
  if (!pts.length) return [];
  const out: PeriodRet[] = [];
  const first = dayNum(pts[0].date);
  const last = dayNum(pts[pts.length - 1].date);
  const dow = (n: number) => new Date(n * 86400000).getUTCDay();
  for (let ws = first - dow(first); ws <= last; ws += 7) {
    const r = periodReturn(pts, numToDate(ws - 1), numToDate(ws + 6), numToDate(ws));
    if (r) out.push(r);
  }
  return out;
}

export function yearlyReturns(months: PeriodRet[]): PeriodRet[] {
  const map = new Map<string, PeriodRet>();
  const cum = new Map<string, number>();
  for (const m of months) {
    const y = m.key.slice(0, 4);
    const cur = map.get(y);
    const c = (cum.get(y) ?? 1) * (1 + m.pct / 100);
    cum.set(y, c);
    map.set(y, {
      key: y,
      gain: (cur?.gain ?? 0) + m.gain,
      flow: (cur?.flow ?? 0) + m.flow,
      startNav: cur?.startNav ?? m.startNav,
      endNav: m.endNav,
      points: (cur?.points ?? 0) + m.points,
      pct: (c - 1) * 100,
    });
  }
  return Array.from(map.values());
}

/* ───────── Stats ───────── */
export interface Stats {
  nav: number;
  netDeposits: number;
  profit: number;
  retPct: number;
  twrPct: number;
  annualized: number | null;
  maxDD: number;
  best: PeriodRet | null;
  worst: PeriodRet | null;
  winRate: number | null;
  avgMonth: number | null;
  vol: number | null;
  ratio: number | null;
  profitFactor: number | null;
  streak: number;
  days: number;
  months: PeriodRet[];
}

export function computeStats(pts: Point[]): Stats {
  const last = pts[pts.length - 1];
  const months = monthlyReturns(pts);
  const empty = !last;
  const days = empty ? 0 : dayNum(last.date) - dayNum(pts[0].date);
  const pcts = months.map(m => m.pct);
  const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
  const vol = pcts.length > 1 && avg !== null ? Math.sqrt(pcts.reduce((a, b) => a + (b - avg) ** 2, 0) / (pcts.length - 1)) : null;
  const gains = months.filter(m => m.gain > 0).reduce((a, m) => a + m.gain, 0);
  const losses = Math.abs(months.filter(m => m.gain < 0).reduce((a, m) => a + m.gain, 0));
  let streak = 0;
  for (let i = months.length - 1; i >= 0; i--) {
    const w = months[i].gain >= 0;
    if (i === months.length - 1) streak = w ? 1 : -1;
    else if (w && streak > 0) streak++;
    else if (!w && streak < 0) streak--;
    else break;
  }
  const twr = empty ? 0 : (last.index - 1) * 100;
  return {
    nav: last?.nav ?? 0,
    netDeposits: last?.deposits ?? 0,
    profit: last?.profit ?? 0,
    retPct: last?.ret ?? 0,
    twrPct: twr,
    annualized: !empty && days >= 60 && last.index > 0 ? (Math.pow(last.index, 365 / days) - 1) * 100 : null,
    maxDD: pts.length ? Math.min(...pts.map(p => p.dd)) * 100 : 0,
    best: months.length ? months.reduce((a, b) => (b.pct > a.pct ? b : a)) : null,
    worst: months.length ? months.reduce((a, b) => (b.pct < a.pct ? b : a)) : null,
    winRate: months.length ? (months.filter(m => m.gain >= 0).length / months.length) * 100 : null,
    avgMonth: avg,
    vol,
    ratio: vol && avg !== null && vol > 0 ? avg / vol : null,
    profitFactor: losses > 0 ? gains / losses : gains > 0 ? Infinity : null,
    streak,
    days,
    months,
  };
}

/* ───────── Allocation ───────── */
export interface AllocSlice { key: string; label: string; color: string; value: number }

export function allocation(snaps: VaultSnapshot[], flows: VaultCashflow[], ids: string[]): AllocSlice[] {
  const acc: Record<string, number> = {};
  const add = (k: string, v: number) => { acc[k] = (acc[k] ?? 0) + v; };
  for (const p of ids) {
    const ps = snaps.filter(s => s.portfolioId === p).sort((a, b) => a.date.localeCompare(b.date));
    const snap = ps[ps.length - 1];
    const after = flows.filter(f => f.portfolioId === p && (!snap || f.date > snap.date)).reduce((a, f) => a + signed(f), 0);
    if (!snap) { add('unclassified', after); continue; }
    let classified = 0;
    for (const k of ASSET_KEYS) {
      const v = snap.breakdown?.[k] ?? 0;
      classified += v;
      if (v) add(k, v);
    }
    const rest = snap.total - classified;
    if (rest > 0.5) add('unclassified', rest);
    add('cash', after);
  }
  const slices: AllocSlice[] = ASSET_KEYS.map(k => ({ key: k, label: ASSET_META[k as AssetKey].label, color: ASSET_META[k as AssetKey].color, value: acc[k] ?? 0 }));
  slices.push({ key: 'unclassified', ...UNCLASSIFIED, value: acc.unclassified ?? 0 });
  return slices.filter(s => s.value > 0.5);
}

/* ───────── Portfolio comparison ───────── */
export interface PortfolioStat {
  portfolio: VaultPortfolio;
  stats: Stats;
  share: number;
  profitShare: number;
  score: number;
  radar: { ret: number; stability: number; safety: number; consistency: number };
}

export function comparePortfolios(snaps: VaultSnapshot[], flows: VaultCashflow[], portfolios: VaultPortfolio[]): PortfolioStat[] {
  const rows = portfolios.map(p => ({ portfolio: p, stats: computeStats(buildSeries(snaps, flows, [p.id])) }));
  const totalNav = rows.reduce((a, r) => a + r.stats.nav, 0);
  const totalProfit = rows.reduce((a, r) => a + r.stats.profit, 0);
  return rows.map(r => {
    const s = r.stats;
    const ret = Math.max(0, Math.min(100, 50 + s.twrPct * 2));
    const stability = s.vol === null ? 50 : Math.max(0, 100 - s.vol * 8);
    const safety = Math.max(0, 100 + s.maxDD * 4);
    const consistency = s.winRate ?? 50;
    const score = Math.round(ret * 0.4 + stability * 0.2 + safety * 0.2 + consistency * 0.2);
    const radar = { ret, stability, safety, consistency };
    return { ...r, radar, share: totalNav > 0 ? (s.nav / totalNav) * 100 : 0, profitShare: totalProfit !== 0 ? (s.profit / totalProfit) * 100 : 0, score };
  });
}

/** Merge several series into a single dataset keyed by date (carry-forward) for race charts. */
export function raceData(seriesById: Record<string, ChartPoint[]>): Record<string, number | string>[] {
  const dates = Array.from(new Set(Object.values(seriesById).flatMap(s => s.map(p => p.date)))).sort();
  const last: Record<string, number> = {};
  return dates.map(d => {
    const row: Record<string, number | string> = { date: d };
    for (const [id, s] of Object.entries(seriesById)) {
      const p = s.find(x => x.date === d);
      if (p) last[id] = p.pTwr;
      if (id in last) row[id] = last[id];
    }
    return row;
  });
}

/* ───────── Cashflow analytics ───────── */
export function flowsByTag(flows: VaultCashflow[]) {
  const map = new Map<string, { tag: string; emoji: string; deposit: number; withdrawal: number }>();
  for (const f of flows) {
    const cur = map.get(f.tag) ?? { tag: f.tag, emoji: f.emoji ?? '', deposit: 0, withdrawal: 0 };
    cur[f.type] += f.amount;
    map.set(f.tag, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.deposit + b.withdrawal - (a.deposit + a.withdrawal));
}

export function flowsByMonth(flows: VaultCashflow[]) {
  const map = new Map<string, { month: string; deposit: number; withdrawal: number; net: number }>();
  for (const f of flows) {
    const k = f.date.slice(0, 7);
    const cur = map.get(k) ?? { month: k, deposit: 0, withdrawal: 0, net: 0 };
    cur[f.type] += f.amount;
    cur.net = cur.deposit - cur.withdrawal;
    map.set(k, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function profitTotals(rows: VaultMonthProfit[]) {
  return rows.reduce(
    (a, r) => ({
      retainedMine: a.retainedMine + r.retainedMine,
      retainedPartner: a.retainedPartner + r.retainedPartner,
      distributedMine: a.distributedMine + r.distributedMine,
      distributedPartner: a.distributedPartner + r.distributedPartner,
    }),
    { retainedMine: 0, retainedPartner: 0, distributedMine: 0, distributedPartner: 0 },
  );
}

/* ───────── Partner split (Total Ownership - Partner Capital) ─────────
 * المحفظة بأكملها وأرباحها واستثماراتها ملك للمستخدم، مخصوماً منها رأس مال الشريك المرجعي (570 ألف).
 * أصل رأس مال المستخدم يُحسب تلقائياً من أقدم قيمة سوقية + صافي الإيداعات.
 * الشريك له رأس ماله المرجعي ثابتاً، مع شارت نمو تقديري يوضح أداء أمواله في المحفظة. */
export function partnerSplit(
  pts: Point[],
  partnerSettings?: { partnerCapital?: number }
): { partner: Point[]; mine: Point[]; hasPartner: boolean } {
  if (!pts.length) return { partner: [], mine: pts, hasPartner: false };

  // رأس مال الشريك المعتمد المرجعي فقط (افتراضياً 570 ألف)
  const partnerCap = partnerSettings?.partnerCapital ?? 570000;

  // حصة المستخدم: كل شيء في المحفظة هو ملك المستخدم، مخصوماً منه رأس مال الشريك
  const mine: Point[] = pts.map(p => {
    const nav = Math.max(0, p.nav - partnerCap);
    const deposits = Math.max(0, p.deposits - partnerCap);
    const profit = nav - deposits;
    const ret = deposits > 0 ? (profit / deposits) * 100 : p.ret;
    const k = p.nav > 0 ? nav / p.nav : 0;
    return {
      ...p,
      nav,
      deposits,
      flow: p.flow,
      profit,
      ret,
      index: p.index,
      dd: p.dd,
      by: Object.fromEntries(Object.entries(p.by).map(([a, v]) => [a, v * k])),
    };
  });

  // حصة الشريك: رأس ماله المرجعي مع انعكاس نمو المحفظة كأداة عرض لصالحه
  const partner: Point[] = pts.map(p => {
    const pProfit = p.deposits > 0 ? (partnerCap / p.deposits) * p.profit : 0;
    const nav = Math.min(p.nav, partnerCap + pProfit);
    const k = p.nav > 0 ? nav / p.nav : 0;
    return {
      ...p,
      nav,
      deposits: partnerCap,
      flow: 0,
      profit: nav - partnerCap,
      ret: partnerCap > 0 ? ((nav - partnerCap) / partnerCap) * 100 : 0,
      index: p.index,
      dd: p.dd,
      by: Object.fromEntries(Object.entries(p.by).map(([a, v]) => [a, v * k])),
    };
  });

  return { partner, mine, hasPartner: true };
}
