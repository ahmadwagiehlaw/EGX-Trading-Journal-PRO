import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Crown, ArrowUpRight, Scale, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx, tone, GoldBarIcon } from './ui';
import { useVault } from './VaultContext';
import { ASSET_META } from './types';
import type { Period } from './calc';
import { PERIODS, allocation, buildAssetHistory, buildSeries, comparePortfolios, computeCashAmmo, fmt, fmtCompact, fmtPct, fmtSigned, fmtDate, raceData, shortDate, windowSeries } from './calc';

type ChartTab = 'race' | 'gold' | 'assets' | 'nav' | 'quality';
type AllocPreset = 'growth' | 'balanced' | 'defensive' | 'custom';

interface TargetWeights {
  stocks: number;
  cash: number;
  gold: number;
  fixed: number;
}

const PRESET_WEIGHTS: Record<Exclude<AllocPreset, 'custom'>, TargetWeights> = {
  growth: { stocks: 65, cash: 15, gold: 10, fixed: 10 },
  balanced: { stocks: 50, cash: 20, gold: 15, fixed: 15 },
  defensive: { stocks: 35, cash: 25, gold: 20, fixed: 20 },
};

const EXPECTED_ANNUAL_YIELD: TargetWeights = {
  stocks: 28,
  gold: 24,
  fixed: 20,
  cash: 0,
};

const TARGET_ALLOC_KEY = 'egx_vault_target_alloc_v1';

function loadTargetState(): { preset: AllocPreset; weights: TargetWeights } {
  try {
    const raw = localStorage.getItem(TARGET_ALLOC_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.preset && p?.weights) return p;
    }
  } catch {
    // ignore
  }
  return { preset: 'balanced', weights: PRESET_WEIGHTS.balanced };
}

export function PortfoliosView({ factor, scopeIds, onFocus }: { factor: number; scopeIds: string[]; onFocus: (id: string) => void }) {
  const { settings, snapshots, cashflows } = useVault();
  const [period, setPeriod] = useState<Period>('All');
  const [chartTab, setChartTab] = useState<ChartTab>('race');
  const [goldUnit, setGoldUnit] = useState<'egp' | 'pct'>('egp');
  const [assetView, setAssetView] = useState<'history' | 'donut'>('history');
  const [allocState, setAllocState] = useState<{ preset: AllocPreset; weights: TargetWeights }>(loadTargetState);
  const ports = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);

  const selectPreset = (preset: AllocPreset) => {
    const weights = preset === 'custom' ? allocState.weights : PRESET_WEIGHTS[preset];
    const next = { preset, weights };
    setAllocState(next);
    try { localStorage.setItem(TARGET_ALLOC_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const updateCustomWeight = (k: keyof TargetWeights, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    const next = { preset: 'custom' as AllocPreset, weights: { ...allocState.weights, [k]: clamped } };
    setAllocState(next);
    try { localStorage.setItem(TARGET_ALLOC_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const rows = useMemo(() => comparePortfolios(snapshots, cashflows, ports), [snapshots, cashflows, ports]);
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const [activePortId, setActivePortId] = useState<string>('');
  const activeR = ranked.find(r => r.portfolio.id === activePortId) ?? ranked[0];

  const cashAmmo = useMemo(() => computeCashAmmo(snapshots, cashflows, ports, scopeIds, factor), [snapshots, cashflows, ports, scopeIds, factor]);
  const alloc = useMemo(() => allocation(snapshots, cashflows, scopeIds).map(s => ({ ...s, value: s.value * factor })), [snapshots, cashflows, scopeIds, factor]);
  const allocTotal = alloc.reduce((a, s) => a + s.value, 0);
  const assetHistory = useMemo(() => buildAssetHistory(snapshots, scopeIds, factor), [snapshots, scopeIds, factor]);
  const goldHistory = useMemo(() => {
    const firstGoldIdx = assetHistory.findIndex(p => p.gold > 0);
    if (firstGoldIdx === -1) return [];
    const startIdx = Math.max(0, firstGoldIdx - 1);
    return assetHistory.slice(startIdx);
  }, [assetHistory]);

  const race = useMemo(() => {
    const m: Record<string, ReturnType<typeof windowSeries>> = {};
    ports.forEach(p => { m[p.id] = windowSeries(buildSeries(snapshots, cashflows, [p.id]), period); });
    return raceData(m);
  }, [snapshots, cashflows, ports, period]);

  const stack = useMemo(() => {
    const pts = buildSeries(snapshots, cashflows, ports.map(p => p.id));
    return pts.map(p => ({ date: p.date, ...Object.fromEntries(ports.map(x => [x.id, (p.by[x.id] ?? 0) * factor])) }));
  }, [snapshots, cashflows, ports, factor]);

  const perPortfolioAlloc = useMemo(() => ports.map(p => ({ p, slices: allocation(snapshots, cashflows, [p.id]) })), [snapshots, cashflows, ports]);

  const radarData = [
    { k: 'العائد', ...Object.fromEntries(rows.map(r => [r.portfolio.id, r.radar.ret])) },
    { k: 'الاستقرار', ...Object.fromEntries(rows.map(r => [r.portfolio.id, r.radar.stability])) },
    { k: 'الأمان', ...Object.fromEntries(rows.map(r => [r.portfolio.id, r.radar.safety])) },
    { k: 'الاتساق', ...Object.fromEntries(rows.map(r => [r.portfolio.id, r.radar.consistency])) },
  ];

  if (!snapshots.length && !cashflows.length) return <Card><Empty text="سجّل بيانات المحافظ أولاً لتظهر المقارنات" /></Card>;

  return (
    <div className="space-y-4">
      {/* Unified Single Portfolio Card with Switcher Tabs */}
      {activeR && (() => {
        const s = activeR.stats;
        const series = buildSeries(snapshots, cashflows, [activeR.portfolio.id]).slice(-45);
        const pCashObj = cashAmmo.byPortfolio.find(c => c.portfolioId === activeR.portfolio.id);
        const pCash = pCashObj?.cashAmount ?? 0;
        const pCashPct = pCashObj?.cashPct ?? 0;
        const pGold = pCashObj?.goldAmount ?? 0;
        const pGoldPct = pCashObj?.goldPct ?? 0;
        const pStocks = pCashObj?.stocksAmount ?? Math.round(s.nav * factor);
        const pStocksPct = pCashObj?.stocksPct ?? Math.max(0, 100 - pCashPct - pGoldPct);
        const pOther = pCashObj?.otherAmount ?? 0;
        const pOtherPct = pCashObj?.otherPct ?? 0;

        return (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-lg space-y-4">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: activeR.portfolio.color }} />

            {/* Header: Portfolio Switcher Tabs & Focus Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {ranked.map((r, i) => {
                  const isSelected = r.portfolio.id === activeR.portfolio.id;
                  return (
                    <button
                      key={r.portfolio.id}
                      type="button"
                      onClick={() => setActivePortId(r.portfolio.id)}
                      className={cx(
                        'group relative flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-black transition-all duration-200 active:scale-95 border',
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md border-transparent ring-2'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60'
                      )}
                      style={{ borderColor: isSelected ? r.portfolio.color : undefined }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.portfolio.color }} />
                      <span>{r.portfolio.name}</span>
                      {i === 0 && ranked.length > 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span
                        dir="ltr"
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums transition-colors',
                          isSelected
                            ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950'
                            : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        {fmtCompact(r.stats.nav * factor)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Left actions: Focus Button + Score Badge */}
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-sm"
                  style={{ background: activeR.portfolio.color }}
                >
                  تقييم {activeR.score}
                </span>
                <button
                  type="button"
                  onClick={() => onFocus(activeR.portfolio.id)}
                  title="تركيز العرض على هذه المحفظة في لوحة التحكم"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition active:scale-95"
                >
                  <span>تركيز</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Active Portfolio Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
              {/* Financials & Share */}
              <div className="md:col-span-4 space-y-2.5">
                <div>
                  <div className="text-[11px] font-bold text-slate-400">القيمة السوقية للحصة</div>
                  <div dir="ltr" className="text-3xl sm:text-4xl font-black tabular-nums text-right text-slate-900 dark:text-white">
                    {fmt(s.nav * factor)} <span className="text-sm font-bold text-slate-400">ج.م</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black">
                  <span dir="ltr" className={cx('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl', tone(s.profit) === 'text-emerald-500' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20')}>
                    {fmtSigned(s.profit * factor)}
                  </span>
                  <span dir="ltr" className={cx('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl', tone(s.twrPct) === 'text-emerald-500' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20')}>
                    العائد: {fmtPct(s.twrPct)}
                  </span>
                </div>

                <div className="pt-0.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>حصتها من إجمالي الخزنة</span>
                    <span className="font-black text-slate-700 dark:text-slate-200 tabular-nums">{activeR.share.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${activeR.share}%`, background: activeR.portfolio.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Assets, Cash, Gold & Other Allocation */}
              <div className="md:col-span-3 space-y-1.5">
                <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 px-2.5 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">📈 الأسهم</span>
                    <span dir="ltr" className="text-[10px] font-bold text-slate-400 tabular-nums">{pStocksPct.toFixed(0)}%</span>
                  </div>
                  <b dir="ltr" className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{fmt(pStocks)}</b>
                </div>
                <div className="rounded-xl bg-sky-500/[0.07] border border-sky-500/25 px-2.5 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-sky-700 dark:text-sky-400">💵 الكاش</span>
                    <span dir="ltr" className="text-[10px] font-bold text-slate-400 tabular-nums">{pCashPct.toFixed(0)}%</span>
                  </div>
                  <b dir="ltr" className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 tabular-nums">{fmt(pCash)}</b>
                </div>
                {pGold > 0 && (
                  <div className="rounded-xl bg-gradient-to-l from-amber-500/[0.16] via-yellow-400/[0.1] to-amber-500/[0.05] border border-amber-400/50 px-2.5 py-1.5 flex items-center justify-between shadow-xs shadow-amber-500/10">
                    <div className="flex items-center gap-1.5">
                      <GoldBarIcon className="w-5 h-4" />
                      <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">الذهب</span>
                      <span dir="ltr" className="text-[10px] font-black text-amber-600/80 dark:text-amber-300/80 tabular-nums">{pGoldPct.toFixed(0)}%</span>
                    </div>
                    <b dir="ltr" className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-200 tabular-nums">{fmt(pGold)}</b>
                  </div>
                )}
                {pOther > 0 && (
                  <div className="rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">🏦 دخل ثابت</span>
                      <span dir="ltr" className="text-[10px] font-bold text-slate-400 tabular-nums">{pOtherPct.toFixed(0)}%</span>
                    </div>
                    <b dir="ltr" className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 tabular-nums">{fmt(pOther)}</b>
                  </div>
                )}
              </div>

              {/* Sparkline Curve */}
              <div className="md:col-span-5 h-28 -mx-1" dir="ltr">
                {series.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
                      <defs>
                        <linearGradient id={`unifiedSp${activeR.portfolio.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={activeR.portfolio.color} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={activeR.portfolio.color} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        content={
                          <ChartTip
                            labelFmt={fmtDate}
                            rows={d => [{ name: activeR.portfolio.name, value: fmt(+d.nav), color: activeR.portfolio.color }]}
                          />
                        }
                      />
                      <Area
                        dataKey="nav"
                        type="monotone"
                        stroke={activeR.portfolio.color}
                        strokeWidth={2.5}
                        fill={`url(#unifiedSp${activeR.portfolio.id})`}
                        isAnimationActive
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">لا تتوفر نقاط كافية للرسم</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Unified wide chart card — Institutional 5-Tab Intelligence Center */}
      <Card
        title={
          chartTab === 'race'
            ? 'سباق المحافظ (%)'
            : chartTab === 'gold'
            ? (
              <span className="inline-flex items-center gap-1.5">
                <GoldBarIcon className="w-5 h-4" />
                <span>تطور الذهب</span>
              </span>
            )
            : chartTab === 'assets'
            ? 'تطور وتوزيع الأصول'
            : chartTab === 'nav'
            ? 'تطور القيمة السوقية'
            : 'جودة الإدارة'
        }
        right={
          <div className="flex flex-wrap items-center gap-2">
            {chartTab === 'race' && <Segmented size="sm" value={period} onChange={setPeriod} options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))} />}
            {chartTab === 'gold' && (
              <Segmented size="sm" value={goldUnit} onChange={setGoldUnit} options={[{ v: 'egp', label: 'بالجنيه (ج.م)' }, { v: 'pct', label: 'الوزن (%)' }]} />
            )}
            {chartTab === 'assets' && (
              <Segmented size="sm" value={assetView} onChange={setAssetView} options={[{ v: 'history', label: 'التطور الزمني' }, { v: 'donut', label: 'التوزيع الحالي' }]} />
            )}
            <Segmented
              size="sm"
              value={chartTab}
              onChange={setChartTab}
              options={[
                { v: 'race' as ChartTab, label: 'سباق المحافظ' },
                { v: 'gold' as ChartTab, label: 'الذهب' },
                { v: 'assets' as ChartTab, label: 'الأصول' },
                { v: 'nav' as ChartTab, label: 'القيمة السوقية' },
                { v: 'quality' as ChartTab, label: 'الجودة' },
              ]}
            />
          </div>
        }
      >
        {(chartTab === 'race' || chartTab === 'nav' || chartTab === 'quality') && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 pb-2.5 border-b border-slate-200/60 dark:border-white/[0.06] text-[11px] font-bold text-slate-500">
            {ports.map(p => {
              const lastVal = chartTab === 'race' && race.length ? Number(race[race.length - 1]?.[p.id]) : null;
              return (
                <span key={p.id} className="flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span>{p.name}</span>
                  {lastVal !== null && Number.isFinite(lastVal) && (
                    <b dir="ltr" className={cx('tabular-nums font-black', tone(lastVal))}>
                      {fmtPct(lastVal, 1)}
                    </b>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {chartTab === 'race' && (
          <div dir="ltr" className="h-80 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={race} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis orientation="right" tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.45} strokeDasharray="3 3" />
                <Tooltip content={<ChartTip labelFmt={fmtDate} rows={p => ports.filter(x => p[x.id] !== undefined).map(x => ({ name: x.name, value: fmtPct(+p[x.id]), color: x.color }))} />} />
                {ports.map((p, idx) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.id}
                    stroke={p.color}
                    strokeWidth={idx === 0 ? 3.2 : 2}
                    strokeOpacity={idx === 0 ? 1 : 0.8}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartTab === 'gold' && (() => {
          if (!goldHistory.length || cashAmmo.totalGold <= 0) {
            return <Empty text="سجّل قيمة الذهب في القيمة السوقية ليظهر منحنى تطور الذهب" />;
          }
          const curGold = goldHistory[goldHistory.length - 1];
          const firstNonZero = goldHistory.find(g => g.gold > 0) ?? curGold;
          const peakGold = Math.max(...goldHistory.map(g => (goldUnit === 'egp' ? g.gold : g.goldPct)));
          const goldDelta = curGold.gold - firstNonZero.gold;
          const goldDeltaPct = firstNonZero.gold > 0 ? (goldDelta / firstNonZero.gold) * 100 : 0;

          return (
            <div className="space-y-3">
              {/* Institutional Gold Ticker Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-2.5 border-b border-amber-400/25 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>قيمة الذهب:</span>
                  <b dir="ltr" className="text-sm font-black text-amber-600 dark:text-amber-300 tabular-nums">
                    {fmt(curGold.gold)} ج.م
                  </b>
                  <span dir="ltr" className="rounded-md bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 tabular-nums">
                    {curGold.goldPct.toFixed(1)}% من الخزنة
                  </span>
                </div>
                {goldHistory.length > 2 && Math.abs(goldDelta) >= 1 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <div className="flex items-center gap-1">
                      <span>التغير:</span>
                      <b dir="ltr" className={cx('tabular-nums font-black', tone(goldDelta))}>
                        {fmtSigned(goldDelta)} ({fmtPct(goldDeltaPct, 1)})
                      </b>
                    </div>
                  </>
                )}
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center gap-1">
                  <span>القمة:</span>
                  <b dir="ltr" className="tabular-nums font-black text-amber-500">
                    {goldUnit === 'egp' ? `${fmt(peakGold)} ج.م` : `${peakGold.toFixed(1)}%`}
                  </b>
                </div>
              </div>

              <div dir="ltr" className="h-72 sm:h-80 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goldHistory} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gGoldArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.42} />
                        <stop offset="60%" stopColor="#facc15" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                      <filter id="goldLineGlow" x="-10%" y="-20%" width="120%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#eab308" floodOpacity="0.45" />
                      </filter>
                    </defs>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={30} />
                    <YAxis
                      orientation="right"
                      tickFormatter={goldUnit === 'egp' ? fmtCompact : (v: number) => `${v.toFixed(1)}%`}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    {peakGold > 0 && (
                      <ReferenceLine y={peakGold} stroke="#eab308" strokeWidth={1.4} strokeDasharray="5 4" strokeOpacity={0.75} />
                    )}
                    <Tooltip
                      cursor={{ stroke: '#eab308', strokeDasharray: '4 4' }}
                      content={
                        <ChartTip
                          labelFmt={fmtDate}
                          rows={p => [
                            { name: 'قيمة الذهب', value: `${fmt(+p.gold)} ج.م`, color: '#eab308' },
                            { name: 'الوزن بالمحفظة', value: `${(+p.goldPct).toFixed(2)}%`, color: '#facc15' },
                            { name: 'إجمالي الخزنة', value: `${fmt(+p.total)} ج.م`, color: '#94a3b8' },
                          ]}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey={goldUnit === 'egp' ? 'gold' : 'goldPct'}
                      stroke="#eab308"
                      strokeWidth={3.2}
                      filter="url(#goldLineGlow)"
                      fill="url(#gGoldArea)"
                      dot={goldHistory.length <= 24 ? { r: 3.5, fill: '#facc15', stroke: '#92400e', strokeWidth: 1.5 } : false}
                      activeDot={{ r: 6, fill: '#eab308', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {chartTab === 'quality' && (
          <div dir="ltr" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                {ports.map(p => <Radar key={p.id} dataKey={p.id} name={p.name} stroke={p.color} fill={p.color} fillOpacity={0.2} strokeWidth={2.2} />)}
                <Tooltip content={<ChartTip rows={d => ports.map(x => ({ name: x.name, value: (+d[x.id]).toFixed(0), color: x.color }))} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartTab === 'nav' && (
          <div dir="ltr" className="h-80 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stack} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<ChartTip labelFmt={fmtDate} rows={p => ports.map(x => ({ name: x.name, value: fmt(+p[x.id]), color: x.color }))} />} />
                {ports.map(p => <Area key={p.id} type="monotone" stackId="1" dataKey={p.id} stroke={p.color} fill={p.color} fillOpacity={0.38} strokeWidth={2} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartTab === 'assets' && (
          alloc.length === 0 ? <Empty text="لا توجد بيانات" /> : assetView === 'history' && assetHistory.length > 1 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-2 border-b border-slate-200/60 dark:border-white/[0.06] text-[11px] font-bold text-slate-500">
                {(['stocks', 'cash', 'gold', 'fixedIncome', 'clouds', 'equityFunds'] as const).map(k => {
                  const hasAny = assetHistory.some(p => p[k] > 0);
                  if (!hasAny) return null;
                  return (
                    <span key={k} className="flex items-center gap-1.5">
                      <i className="w-2.5 h-2.5 rounded-full" style={{ background: ASSET_META[k].color }} />
                      <span>{ASSET_META[k].label}</span>
                    </span>
                  );
                })}
              </div>
              <div dir="ltr" className="h-72 sm:h-80 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={assetHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                    <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      content={
                        <ChartTip
                          labelFmt={fmtDate}
                          rows={p =>
                            (['stocks', 'cash', 'gold', 'fixedIncome', 'clouds', 'equityFunds'] as const)
                              .filter(k => +p[k] > 0)
                              .map(k => ({
                                name: ASSET_META[k].label,
                                value: `${fmt(+p[k])} ج.م (${+p.total > 0 ? ((+p[k] / +p.total) * 100).toFixed(1) : 0}%)`,
                                color: ASSET_META[k].color,
                              }))
                          }
                        />
                      }
                    />
                    <Area type="monotone" stackId="a" dataKey="stocks" stroke={ASSET_META.stocks.color} fill={ASSET_META.stocks.color} fillOpacity={0.42} strokeWidth={1.8} />
                    <Area type="monotone" stackId="a" dataKey="cash" stroke={ASSET_META.cash.color} fill={ASSET_META.cash.color} fillOpacity={0.42} strokeWidth={1.8} />
                    <Area type="monotone" stackId="a" dataKey="fixedIncome" stroke={ASSET_META.fixedIncome.color} fill={ASSET_META.fixedIncome.color} fillOpacity={0.45} strokeWidth={1.8} />
                    <Area type="monotone" stackId="a" dataKey="clouds" stroke={ASSET_META.clouds.color} fill={ASSET_META.clouds.color} fillOpacity={0.45} strokeWidth={1.8} />
                    <Area type="monotone" stackId="a" dataKey="equityFunds" stroke={ASSET_META.equityFunds.color} fill={ASSET_META.equityFunds.color} fillOpacity={0.45} strokeWidth={1.8} />
                    <Area type="monotone" stackId="a" dataKey="gold" stroke={ASSET_META.gold.color} fill={ASSET_META.gold.color} fillOpacity={0.75} strokeWidth={2.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              <div dir="ltr" className="relative h-64 w-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={alloc} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="96%" paddingAngle={3} cornerRadius={8} stroke="none">
                      {alloc.map(s => <Cell key={s.key} fill={s.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip rows={p => [{ name: String(p.label), value: `${fmt(+p.value)} · ${((+p.value / allocTotal) * 100).toFixed(1)}%`, color: String(p.color) }]} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">الإجمالي</span>
                  <span dir="ltr" className="text-lg font-black tabular-nums">{fmtCompact(allocTotal)}</span>
                </div>
              </div>
              <ul className="w-full max-w-sm space-y-2">
                {alloc.map(s => (
                  <li key={s.key} className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      {s.key === 'gold' ? <GoldBarIcon className="w-4 h-3.5" /> : <i className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />}
                      {s.label}
                    </span>
                    <span className="flex items-center gap-3"><b dir="ltr" className="tabular-nums">{fmt(s.value)}</b><span className="w-12 text-left text-slate-400">{((s.value / allocTotal) * 100).toFixed(1)}%</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </Card>

      {/* ───────── Institutional Portfolio Balance Lab (7/12) + Compact Structure & Signals (5/12) ───────── */}
      {(() => {
        const totNav = Math.max(1, cashAmmo.totalNav);
        const actStocks = cashAmmo.byPortfolio.reduce((a, b) => a + b.stocksAmount, 0);
        const actCash = cashAmmo.totalCash;
        const actGold = cashAmmo.totalGold;
        const actFixed = cashAmmo.byPortfolio.reduce((a, b) => a + b.otherAmount, 0);

        const actualPct: TargetWeights = {
          stocks: (actStocks / totNav) * 100,
          cash: (actCash / totNav) * 100,
          gold: (actGold / totNav) * 100,
          fixed: (actFixed / totNav) * 100,
        };

        const w = allocState.weights;
        const wSum = w.stocks + w.cash + w.gold + w.fixed;
        const norm = wSum > 0 ? 100 / wSum : 1;
        const tgtPct: TargetWeights = {
          stocks: w.stocks * norm,
          cash: w.cash * norm,
          gold: w.gold * norm,
          fixed: w.fixed * norm,
        };

        const totalAbsDiff =
          Math.abs(actualPct.stocks - tgtPct.stocks) +
          Math.abs(actualPct.cash - tgtPct.cash) +
          Math.abs(actualPct.gold - tgtPct.gold) +
          Math.abs(actualPct.fixed - tgtPct.fixed);
        const balanceScore = Math.max(0, Math.min(100, Math.round(100 - totalAbsDiff * 0.85)));

        const curExpRet =
          (actualPct.stocks * EXPECTED_ANNUAL_YIELD.stocks +
            actualPct.gold * EXPECTED_ANNUAL_YIELD.gold +
            actualPct.fixed * EXPECTED_ANNUAL_YIELD.fixed +
            actualPct.cash * EXPECTED_ANNUAL_YIELD.cash) / 100;
        const tgtExpRet =
          (tgtPct.stocks * EXPECTED_ANNUAL_YIELD.stocks +
            tgtPct.gold * EXPECTED_ANNUAL_YIELD.gold +
            tgtPct.fixed * EXPECTED_ANNUAL_YIELD.fixed +
            tgtPct.cash * EXPECTED_ANNUAL_YIELD.cash) / 100;
        const expRetGainEgp = Math.round(totNav * ((tgtExpRet - curExpRet) / 100));
        const defensivePct = actualPct.cash + actualPct.gold + actualPct.fixed;

        const buckets: {
          key: keyof TargetWeights;
          label: string;
          color: string;
          actualAmt: number;
          actualPct: number;
          targetPct: number;
          isGold?: boolean;
        }[] = [
          { key: 'stocks', label: 'الأسهم', color: ASSET_META.stocks.color, actualAmt: actStocks, actualPct: actualPct.stocks, targetPct: tgtPct.stocks },
          { key: 'cash', label: 'الكاش', color: ASSET_META.cash.color, actualAmt: actCash, actualPct: actualPct.cash, targetPct: tgtPct.cash },
          { key: 'gold', label: 'الذهب', color: ASSET_META.gold.color, actualAmt: actGold, actualPct: actualPct.gold, targetPct: tgtPct.gold, isGold: true },
          { key: 'fixed', label: 'دخل ثابت', color: ASSET_META.fixedIncome.color, actualAmt: actFixed, actualPct: actualPct.fixed, targetPct: tgtPct.fixed },
        ];

        const topPort = ranked[0];
        const idleCashPort = cashAmmo.byPortfolio.find(bp => bp.cashPct >= 60 && bp.cashAmount >= 10000);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* 1. Scientific Rebalancing & Allocation Simulator (7 cols) */}
            <Card
              className="lg:col-span-7 flex flex-col justify-between"
              title={
                <span className="inline-flex items-center gap-2">
                  <Scale className="w-4 h-4 text-orange-500" />
                  <span>مختبر التوازن وإعادة الهيكلة</span>
                  <span
                    dir="ltr"
                    className={cx(
                      'rounded-lg px-2 py-0.5 text-[10px] font-black tabular-nums',
                      balanceScore >= 80
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : balanceScore >= 55
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {balanceScore}/100
                  </span>
                </span>
              }
              right={
                <Segmented
                  size="sm"
                  value={allocState.preset}
                  onChange={selectPreset}
                  options={[
                    { v: 'growth', label: 'هجومي' },
                    { v: 'balanced', label: 'متوازن' },
                    { v: 'defensive', label: 'دفاعي' },
                    { v: 'custom', label: 'مخصص' },
                  ]}
                />
              }
            >
              <div className="space-y-3.5">
                {/* Custom Target Sliders/Inputs when 'custom' is active */}
                {allocState.preset === 'custom' && (
                  <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/70 dark:border-slate-700/60">
                    {buckets.map(b => (
                      <label key={b.key} className="space-y-1 text-center">
                        <span className="block text-[10px] font-black text-slate-500">{b.label} %</span>
                        <input
                          type="number"
                          dir="ltr"
                          min={0}
                          max={100}
                          value={allocState.weights[b.key]}
                          onChange={e => updateCustomWeight(b.key, Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 text-center text-xs font-black tabular-nums focus:outline-none focus:border-orange-400"
                        />
                      </label>
                    ))}
                    {wSum !== 100 && (
                      <div className="col-span-4 text-center text-[10px] font-black text-amber-500">
                        المجموع: {wSum}% (يتم التطبيع تلقائياً إلى 100%)
                      </div>
                    )}
                  </div>
                )}

                {/* 4 Asset Rebalance Gap Bars */}
                <div className="space-y-2.5">
                  {buckets.map(b => {
                    const diffPct = b.targetPct - b.actualPct;
                    const diffEgp = Math.round((totNav * diffPct) / 100);
                    const isBalanced = Math.abs(diffPct) <= 2.5;
                    const isUnderweight = diffPct > 2.5;

                    return (
                      <div key={b.key} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-100">
                            {b.isGold ? <GoldBarIcon className="w-4 h-3.5" /> : <i className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />}
                            <span>{b.label}</span>
                            <span dir="ltr" className="text-[11px] font-bold text-slate-400 tabular-nums">
                              {b.actualPct.toFixed(1)}% ← {b.targetPct.toFixed(0)}%
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span dir="ltr" className="hidden sm:inline text-[11px] font-bold text-slate-400 tabular-nums">
                              {fmtCompact(b.actualAmt)}
                            </span>
                            {isBalanced ? (
                              <span className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black">
                                ✓ متوازن
                              </span>
                            ) : isUnderweight ? (
                              <span dir="ltr" className="rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black tabular-nums">
                                +{fmtCompact(diffEgp)} تعزيز
                              </span>
                            ) : (
                              <span dir="ltr" className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black tabular-nums">
                                {fmtCompact(diffEgp)} فائض
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visual Actual Bar with Target Vertical Marker */}
                        <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible" dir="ltr">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(1.5, b.actualPct))}%`, background: b.color }}
                          />
                          <div
                            title={`الهدف: ${b.targetPct.toFixed(0)}%`}
                            className="absolute top-[-3px] bottom-[-3px] w-0.5 rounded-full bg-slate-900 dark:bg-white shadow-sm transition-all duration-500"
                            style={{ left: `${Math.min(99, Math.max(1, b.targetPct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Quantitative Simulation Strip: Current vs Target Expected Return + Defensive Cushion */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl bg-slate-50/90 dark:bg-slate-800/50 px-2.5 py-2 text-center border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400">العائد المتوقع الحالي</div>
                    <div dir="ltr" className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                      {curExpRet.toFixed(1)}%
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-500/[0.06] px-2.5 py-2 text-center border border-emerald-500/20">
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">بعد إعادة التوازن</div>
                    <div dir="ltr" className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      {tgtExpRet.toFixed(1)}%{' '}
                      {Math.abs(expRetGainEgp) >= 1000 && (
                        <span className="text-[10px] opacity-85">({fmtSigned(expRetGainEgp)})</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-sky-500/[0.06] px-2.5 py-2 text-center border border-sky-500/20">
                    <div className="text-[10px] font-bold text-sky-700 dark:text-sky-400">الأصول الدفاعية</div>
                    <div dir="ltr" className="text-sm font-black text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
                      {defensivePct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Compact Portfolio Structure & Concentration Radar (5 cols) */}
            <Card title="هيكل المحافظ والتركّز" className="lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Compact Portfolio Stacked Bars */}
                <div className="space-y-3">
                  {perPortfolioAlloc.map(({ p, slices }) => {
                    const tot = slices.reduce((a, s) => a + s.value, 0);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between text-xs font-black mb-1">
                          <span className="flex items-center gap-1.5">
                            <i className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            {p.name}
                          </span>
                          <span dir="ltr" className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">{fmt(tot * factor)}</span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" dir="ltr">
                          {slices.map(s => (
                            <div
                              key={s.key}
                              title={`${s.label} ${fmt(s.value * factor)}`}
                              style={{ width: `${tot > 0 ? (s.value / tot) * 100 : 0}%`, background: s.color }}
                              className="h-full transition-all duration-700"
                            />
                          ))}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-bold text-slate-400">
                          {slices.map(s => (
                            <span key={s.key} className="flex items-center gap-1">
                              <i className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                              {s.label} {tot > 0 ? ((s.value / tot) * 100).toFixed(0) : 0}%
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Crisp Quantitative Diagnostic Signals (Zero Fluff) */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {topPort && topPort.share >= 75 && (
                    <div className="flex items-center justify-between rounded-xl bg-amber-500/[0.08] border border-amber-500/20 px-2.5 py-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>تركّز مرتفع في {topPort.portfolio.name}</span>
                      </span>
                      <b dir="ltr" className="tabular-nums">{topPort.share.toFixed(0)}%</b>
                    </div>
                  )}

                  {idleCashPort && (
                    <div className="flex items-center justify-between rounded-xl bg-sky-500/[0.08] border border-sky-500/20 px-2.5 py-1.5 text-[11px] font-black text-sky-700 dark:text-sky-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>سيولة خامدة في {idleCashPort.portfolioName}</span>
                      </span>
                      <b dir="ltr" className="tabular-nums">{fmtCompact(idleCashPort.cashAmount)} ({idleCashPort.cashPct.toFixed(0)}%)</b>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-l from-amber-500/[0.12] to-yellow-500/[0.04] border border-amber-400/35 px-2.5 py-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <GoldBarIcon className="w-4 h-3.5" />
                      <span>وزن الذهب مقابل الهدف</span>
                    </span>
                    <b dir="ltr" className="tabular-nums">
                      {actualPct.gold.toFixed(1)}% / {tgtPct.gold.toFixed(0)}%
                    </b>
                  </div>

                  {balanceScore >= 80 && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-2.5 py-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>توزيع متوازن ومتوافق مع الخطة</span>
                      </span>
                      <b dir="ltr">{balanceScore}%</b>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Table */}
      <Card title="جدول المقارنة" pad={false}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[760px] text-xs font-bold" dir="rtl">
            <thead>
              <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                {['#', 'المحفظة', 'القيمة', 'صافي الإيداع', 'العوائد', 'العائد الزمني', 'سنوي', 'أقصى هبوط', 'شهور رابحة', 'التذبذب', 'من الأرباح', 'التقييم'].map(h => <th key={h} className="px-2 py-2.5 text-right font-black">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.portfolio.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 tabular-nums">
                  <td className="px-2 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-3"><span className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100"><i className="w-2.5 h-2.5 rounded-full" style={{ background: r.portfolio.color }} />{r.portfolio.name}</span></td>
                  <td className="px-2 py-3" dir="ltr">{fmt(r.stats.nav * factor)}</td>
                  <td className="px-2 py-3" dir="ltr">{fmt(r.stats.netDeposits * factor)}</td>
                  <td className={cx('px-2 py-3', tone(r.stats.profit))} dir="ltr">{fmtSigned(r.stats.profit * factor)}</td>
                  <td className={cx('px-2 py-3', tone(r.stats.twrPct))} dir="ltr">{fmtPct(r.stats.twrPct)}</td>
                  <td className="px-2 py-3" dir="ltr">{r.stats.annualized === null ? '—' : fmtPct(r.stats.annualized, 1)}</td>
                  <td className="px-2 py-3 text-rose-500" dir="ltr">{r.stats.maxDD.toFixed(1)}%</td>
                  <td className="px-2 py-3" dir="ltr">{r.stats.winRate === null ? '—' : `${r.stats.winRate.toFixed(0)}%`}</td>
                  <td className="px-2 py-3" dir="ltr">{r.stats.vol === null ? '—' : `±${r.stats.vol.toFixed(1)}%`}</td>
                  <td className="px-2 py-3" dir="ltr">{r.profitShare.toFixed(0)}%</td>
                  <td className="px-2 py-3"><span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white" style={{ background: r.portfolio.color }}>{r.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
