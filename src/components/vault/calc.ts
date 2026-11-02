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
  const F = flows.filter(f => sel.has(f.portfolioId) && !f.opening && !f.partner);
  const minSnapDate = S[0]?.date;
  const dates = Array.from(new Set([...S.map(s => s.date), ...F.map(f => f.date)]))
    .filter(d => !minSnapDate || d >= minSnapDate)
    .sort();
  if (!dates.length) return [];

  // خريطة لأقدم قراءة سوقية لكل محفظة (لتكون أساس رأس المال المودع الذكي)
  const firstSnapByPid = new Map<string, VaultSnapshot>();
  for (const s of S) {
    if (!firstSnapByPid.has(s.portfolioId)) {
      firstSnapByPid.set(s.portfolioId, s);
    }
  }

  const startD = dayNum(dates[0]);
  let peak = 1;

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

    // حساب صافي رأس المال المودع ديناميكياً + متوسط رأس المال المرجح زمنياً (Modified Dietz) لحساب TWR و CAGR بدقة
    let deposits = 0;
    let avgCap = 0;
    let flow = 0;
    const curD = dayNum(d);
    const elapsed = Math.max(1, curD - startD);

    for (const p of ids) {
      const fs = firstSnapByPid.get(p);
      if (fs) {
        if (d >= fs.date) {
          deposits += fs.total;
          avgCap += fs.total;
          for (const f of F) {
            if (f.portfolioId === p && f.date > fs.date && f.date <= d) {
              const sf = signed(f);
              deposits += sf;
              const w = curD > startD ? Math.max(0.05, (curD - dayNum(f.date)) / elapsed) : 1;
              avgCap += sf * w;
            }
          }
        } else {
          for (const f of F) {
            if (f.portfolioId === p && f.date <= d) {
              const sf = signed(f);
              deposits += sf;
              avgCap += sf;
            }
          }
        }
      } else {
        for (const f of F) {
          if (f.portfolioId === p && f.date <= d) {
            const sf = signed(f);
            deposits += sf;
            avgCap += sf;
          }
        }
      }
    }

    for (const f of F) {
      if (f.date === d) flow += signed(f);
    }

    const profit = nav - deposits;
    const ret = deposits > 0 ? (profit / deposits) * 100 : 0;
    const twr = avgCap > 0 ? profit / avgCap : 0;
    const index = Math.max(0.1, 1 + twr);
    peak = Math.max(peak, index);
    const dd = index / peak - 1;
    return { date: d, nav, deposits, flow, profit, ret, index, dd, by };
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
  // عند اختيار "الكل" (All) تكون العوائد والنمو التراكمي منذ البداية بالكامل،
  // وعند اختيار فترة زمنية محددة (1M/3M/6M/1Y/2Y) تقاس العوائد والنمو من أول نقطة داخل الفترة المختارة بدقة (تبدأ من 0 عند win[0])
  const base = win[0];
  let peak = 0;
  const mapped = win.map(p => {
    const rel = base.index > 0 ? p.index / base.index : 1;
    peak = Math.max(peak, rel);
    return {
      ...p,
      pProfit: period === 'All' ? p.profit : p.profit - base.profit,
      pTwr: period === 'All' ? (p.index - 1) * 100 : (rel - 1) * 100,
      pDd: period === 'All' ? p.dd * 100 : (rel / peak - 1) * 100,
    };
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
  let prev: Point | null = null;
  for (const p of pts) if (p.date <= S) prev = p;
  const end = win[win.length - 1];
  const basePt = prev ?? win[0];
  const startNav = prev ? prev.nav : win[0].deposits;
  const total = Math.max(1, dayNum(E) - dayNum(prev ? S : win[0].date));
  let flow = 0;
  let wFlow = 0;
  let lastDep = basePt.deposits;
  const flowPts = prev ? win : win.slice(1);
  for (const p of flowPts) {
    const stepFlow = p.deposits - lastDep;
    lastDep = p.deposits;
    flow += stepFlow;
    wFlow += stepFlow * Math.min(1, Math.max(0, (dayNum(E) - dayNum(p.date) + 0.5) / total));
  }
  const gain = end.profit - (prev ? prev.profit : 0);
  // إذا كان الشهر الأول يحتوي فقط على قراءة التأسيس الافتتاحية بدون أي تغير ربحي، نتخطاه حتى لا يشوه متوسط الشهور ونسبة الفوز
  if (!prev && win.length === 1 && Math.abs(gain) < 0.5) return null;
  const denom = Math.max(1, startNav + wFlow);
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

  // رأس مال الشريك المعتمد المرجعي فقط (افتراضياً 570 ألف ج.م)
  const partnerCap = partnerSettings?.partnerCapital ?? 570000;

  // تواريخ دخول أموال الشريك:
  // قبل فبراير 2026: لم يكن للشريك رأس مال مسجل (0 ج.م)
  // من 1 فبراير 2026 إلى 30 أبريل 2026: الدفعة الأولى (500 ألف ج.م)
  // من 1 مايو 2026 فصاعداً: الدفعة الثانية المكتملة (570 ألف ج.م)
  const getPartnerCapAt = (date: string) => {
    if (date < '2026-02-01') return 0;
    if (date < '2026-05-01') return Math.min(partnerCap, 500000);
    return partnerCap;
  };

  // 1. حصة الشريك: تبدأ من تاريخ دخوله، وتطبق عليها نفس نسبة نمو المحفظة الإجمالية كعرض تقديري
  const partner: Point[] = pts.map(p => {
    const curCap = getPartnerCapAt(p.date);
    const pProfit = curCap > 0 ? Math.max(0, curCap * (p.ret / 100)) : 0;
    const nav = curCap + pProfit;
    const k = p.nav > 0 ? nav / p.nav : 0;
    return {
      ...p,
      nav: curCap > 0 ? nav : 0,
      deposits: curCap,
      flow: 0,
      profit: pProfit,
      ret: curCap > 0 && pProfit > 0 ? (pProfit / curCap) * 100 : 0,
      index: curCap > 0 ? 1 + pProfit / curCap : 1,
      dd: 0,
      by: Object.fromEntries(Object.entries(p.by).map(([a, v]) => [a, v * k])),
    };
  });

  // 2. حصتي: المحفظة هي ملك المستخدم بالكامل، مخصوماً منها التزام رأس مال الشريك عند دخوله
  let prevMineDep = 0;
  const mine: Point[] = pts.map((p, idx) => {
    const curPartnerCap = getPartnerCapAt(p.date);
    const nav = Math.max(0, p.nav - curPartnerCap);
    const deposits = Math.max(0, p.deposits - curPartnerCap);
    const flow = idx === 0 ? 0 : deposits - prevMineDep;
    prevMineDep = deposits;
    const profit = nav - deposits;
    const ret = deposits > 0 ? (profit / deposits) * 100 : p.ret;
    const k = p.nav > 0 ? nav / p.nav : 0;
    // يتبع مؤشر نمو حصة المستخدم عائده الحقيقي الإيجابي ليعكس بدقة الأرباح التراكمية الإيجابية
    const index = deposits > 0 ? Math.max(0.1, 1 + ret / 100) : p.index;
    return {
      ...p,
      nav,
      deposits,
      flow,
      profit,
      ret,
      index,
      dd: p.dd,
      by: Object.fromEntries(Object.entries(p.by).map(([a, v]) => [a, v * k])),
    };
  });

  return { partner, mine, hasPartner: true };
}

/* ───────── Market Benchmarks (EGX30 · EGX70 · Bank Risk-Free Rate) ───────── */
export interface MarketIndexPerf {
  symbol: string;
  label: string;
  close: number;
  change: number;
  w: number;   // 1W %
  m1: number;  // 1M %
  m3: number;  // 3M %
  m6: number;  // 6M %
  y1: number;  // 1Y %
  ytd: number; // YTD %
  y5: number;  // 5Y %
  sma30?: number;
  sma50?: number;
  sma100?: number;
}

export interface BenchmarksState {
  egx30: MarketIndexPerf;
  egx70: MarketIndexPerf;
  updatedAt: number;
  live: boolean;
}

export const DEFAULT_BENCHMARKS: BenchmarksState = {
  egx30: {
    symbol: 'EGX30',
    label: 'EGX 30',
    close: 48403.1,
    change: -0.7,
    w: -1.71,
    m1: -6.75,
    m3: -10.85,
    m6: -8.5,
    y1: 26.28,
    ytd: 15.68,
    y5: 318.41,
    sma30: 51844.2,
    sma50: 53334.6,
    sma100: 53197.6,
  },
  egx70: {
    symbol: 'EGX70',
    label: 'EGX 70',
    close: 16293.7,
    change: -2.23,
    w: 6.54,
    m1: -12.67,
    m3: -16.16,
    m6: 12.76,
    y1: 34.57,
    ytd: 23.93,
    y5: 603.35,
    sma30: 18237.6,
    sma50: 19427.8,
    sma100: 18557.3,
  },
  updatedAt: Date.now(),
  live: false,
};

const BENCH_CACHE_KEY = 'egx_vault_benchmarks_v2';

export function loadCachedBenchmarks(): BenchmarksState {
  try {
    const raw = localStorage.getItem(BENCH_CACHE_KEY);
    if (!raw) return DEFAULT_BENCHMARKS;
    const parsed = JSON.parse(raw);
    if (parsed?.egx30?.close && parsed?.egx70?.close) return parsed;
  } catch {
    // ignore
  }
  return DEFAULT_BENCHMARKS;
}

export async function fetchEgxBenchmarks(): Promise<BenchmarksState> {
  try {
    const body = JSON.stringify({
      symbols: { tickers: ['EGX:EGX30', 'EGX:EGX70EWI'] },
      columns: ['close', 'change', 'Perf.W', 'Perf.1M', 'Perf.3M', 'Perf.6M', 'Perf.Y', 'Perf.YTD', 'Perf.5Y', 'SMA30', 'SMA50', 'SMA100'],
    });
    // Using text/plain avoids CORS preflight and works directly from browser to TradingView Egypt scanner
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      body,
    });
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    const rows: { s: string; d: number[] }[] = json?.data ?? [];
    const r30 = rows.find(r => r.s.includes('EGX30'))?.d;
    const r70 = rows.find(r => r.s.includes('EGX70'))?.d;
    const prev = loadCachedBenchmarks();
    const next: BenchmarksState = {
      egx30: r30
        ? {
            symbol: 'EGX30',
            label: 'EGX 30',
            close: r30[0] ?? prev.egx30.close,
            change: r30[1] ?? prev.egx30.change,
            w: r30[2] ?? prev.egx30.w,
            m1: r30[3] ?? prev.egx30.m1,
            m3: r30[4] ?? prev.egx30.m3,
            m6: r30[5] ?? prev.egx30.m6,
            y1: r30[6] ?? prev.egx30.y1,
            ytd: r30[7] ?? prev.egx30.ytd,
            y5: r30[8] ?? prev.egx30.y5,
            sma30: r30[9] ?? prev.egx30.sma30,
            sma50: r30[10] ?? prev.egx30.sma50,
            sma100: r30[11] ?? prev.egx30.sma100,
          }
        : prev.egx30,
      egx70: r70
        ? {
            symbol: 'EGX70',
            label: 'EGX 70',
            close: r70[0] ?? prev.egx70.close,
            change: r70[1] ?? prev.egx70.change,
            w: r70[2] ?? prev.egx70.w,
            m1: r70[3] ?? prev.egx70.m1,
            m3: r70[4] ?? prev.egx70.m3,
            m6: r70[5] ?? prev.egx70.m6,
            y1: r70[6] ?? prev.egx70.y1,
            ytd: r70[7] ?? prev.egx70.ytd,
            y5: r70[8] ?? prev.egx70.y5,
            sma30: r70[9] ?? prev.egx70.sma30,
            sma50: r70[10] ?? prev.egx70.sma50,
            sma100: r70[11] ?? prev.egx70.sma100,
          }
        : prev.egx70,
      updatedAt: Date.now(),
      live: true,
    };
    try {
      localStorage.setItem(BENCH_CACHE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  } catch {
    return loadCachedBenchmarks();
  }
}

/** حساب مستوى المؤشر قبل `daysAgo` يوماً بناءً على نقاط الأداء الرسمية والمتوسطات المتحركة الفعلية */
function indexLevelAtDaysAgo(perf: MarketIndexPerf, daysAgo: number): number {
  const c = perf.close || 10000;
  if (daysAgo <= 0) return c;
  const lvl1W = c / Math.max(0.1, 1 + perf.w / 100);
  const lvl1M = c / Math.max(0.1, 1 + perf.m1 / 100);
  const lvl3M = c / Math.max(0.1, 1 + perf.m3 / 100);
  const lvl6M = c / Math.max(0.1, 1 + perf.m6 / 100);
  const lvl1Y = c / Math.max(0.1, 1 + perf.y1 / 100);
  const lvl5Y = c / Math.max(0.1, 1 + perf.y5 / 100);

  // استخراج مستوى المؤشر الفعلي في منتصف الربع (حوالي 58 يوماً مضت - بداية سبتمبر) من المتوسطات المتحركة SMA30 و SMA50
  const lvl2M =
    perf.sma50 && perf.sma30
      ? Math.max(0.1, (50 * perf.sma50 - 30 * perf.sma30) / 20)
      : (lvl1M + lvl3M) / 2;

  // استخراج مستوى المؤشر قبل ~4.5 شهر (حوالي 135 يوماً مضت) من SMA50 و SMA100
  const lvl4_5M =
    perf.sma100 && perf.sma50
      ? Math.max(0.1, 2 * perf.sma100 - perf.sma50)
      : (lvl3M + lvl6M) / 2;

  const anchors: { d: number; level: number }[] = [
    { d: 0, level: c },
    { d: 7, level: lvl1W },
    { d: 30, level: lvl1M },
    { d: 58, level: lvl2M },
    { d: 91, level: lvl3M },
    { d: 135, level: lvl4_5M },
    { d: 182, level: lvl6M },
    { d: 365, level: lvl1Y },
    { d: 1825, level: lvl5Y },
  ];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (daysAgo >= a.d && daysAgo <= b.d) {
      const t = (daysAgo - a.d) / Math.max(1, b.d - a.d);
      return a.level * Math.pow(b.level / a.level, t);
    }
  }
  const lastA = anchors[anchors.length - 1];
  const dailyRate = Math.pow(c / lastA.level, 1 / lastA.d);
  return c / Math.pow(dailyRate, daysAgo);
}

export interface BenchmarkPoint extends ChartPoint {
  bankPct: number;
  bankProfit: number;
  egx30Pct: number;
  egx30Profit: number;
  egx70Pct: number;
  egx70Profit: number;
}

/** بناء سلسلة مقارنة أداء المحفظة مقابل (عائد البنك السنوي + EGX30 + EGX70) بنفس تواريخ وحجم رأس المال العامل */
export function buildBenchmarkSeries(
  winData: ChartPoint[],
  bench: BenchmarksState,
  bankAnnualPct: number,
  dir: 'rtl' | 'ltr' = 'rtl'
): BenchmarkPoint[] {
  if (!winData.length) return [];
  const chronological = dir === 'rtl' ? [...winData].reverse() : [...winData];
  const first = chronological[0];
  const last = chronological[chronological.length - 1];
  const endD = dayNum(last.date);
  const startD = dayNum(first.date);
  const startDaysAgo = Math.max(0, endD - startD);

  const base30 = indexLevelAtDaysAgo(bench.egx30, startDaysAgo);
  const base70 = indexLevelAtDaysAgo(bench.egx70, startDaysAgo);

  // رأس المال المرجعي العامل في بداية الفترة لحساب المكافئ بالجنيه المصري بدقة متطابقة مع النسب المئوية
  let weightedCapSum = 0;
  let totalDaysAcc = 0;

  const out: BenchmarkPoint[] = chronological.map((p, idx) => {
    const curD = dayNum(p.date);
    const daysElapsed = Math.max(0, curD - startD);
    const daysAgo = Math.max(0, endD - curD);

    if (idx > 0) {
      const prev = chronological[idx - 1];
      const dt = Math.max(1, curD - dayNum(prev.date));
      weightedCapSum += Math.max(0, prev.deposits) * dt;
      totalDaysAcc += dt;
    }

    // متوسط رأس المال المستثمر خلال الفترة حتى هذه النقطة
    // وإذا كانت للمحفظة نسبة pTwr وعائد pProfit معروفين، نستخدم رأس المال الفعلي الضمني لتتطابق الفروق بالجنيه 100% مع الفروق بالنسبة المئوية
    const avgInvestedCap =
      Math.abs(p.pTwr) > 0.25 && Math.abs(p.pProfit) > 100
        ? Math.abs(p.pProfit / (p.pTwr / 100))
        : totalDaysAcc > 0
        ? weightedCapSum / totalDaysAcc
        : Math.max(0, first.deposits || first.nav);

    const lvl30 = indexLevelAtDaysAgo(bench.egx30, daysAgo);
    const lvl70 = indexLevelAtDaysAgo(bench.egx70, daysAgo);

    const bankPct = (Math.pow(1 + bankAnnualPct / 100, daysElapsed / 365) - 1) * 100;
    const egx30Pct = base30 > 0 ? (lvl30 / base30 - 1) * 100 : 0;
    const egx70Pct = base70 > 0 ? (lvl70 / base70 - 1) * 100 : 0;

    const bankProfit = avgInvestedCap * (bankPct / 100);
    const egx30Profit = avgInvestedCap * (egx30Pct / 100);
    const egx70Profit = avgInvestedCap * (egx70Pct / 100);

    return {
      ...p,
      bankPct,
      bankProfit,
      egx30Pct,
      egx30Profit,
      egx70Pct,
      egx70Profit,
    };
  });

  return dir === 'rtl' ? [...out].reverse() : out;
}
