import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ComposedChart } from 'recharts';
import { Activity, Flame, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, Trophy, Calendar, Zap, Crown, Banknote, Users, Layers, ChevronUp, RefreshCw, Landmark, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { Card, ChartTip, CountUp, Empty, Segmented, cx, tone } from './ui';
import { useVault } from './VaultContext';
import type { Point, Stats, Period, PeriodRet, BenchmarksState } from './calc';
import {
  PERIODS,
  windowSeries,
  monthlyReturns,
  comparePortfolios,
  computeCashAmmo,
  loadCachedBenchmarks,
  fetchEgxBenchmarks,
  buildBenchmarkSeries,
  fmt,
  fmtCompact,
  fmtPct,
  fmtSigned,
  fmtDate,
  shortDate,
  monthLabel,
  MONTHS_EN,
} from './calc';

type Mode = 'capital' | 'growth' | 'benchmark' | 'monthly' | 'dd';

const splitOffset = (vals: number[]) => {
  const max = Math.max(...vals, 0);
  const min = Math.min(...vals, 0);
  if (max <= 0) return 0;
  if (min >= 0) return 1;
  return max / (max - min);
};

function Ring({ value, color, size = 54, children }: { value: number; color: string; size?: number; children?: React.ReactNode }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

export function Hero({ pts, stats, scopeLabel, lensLabel, scopeIds, factor }: { pts: Point[]; stats: Stats; scopeLabel: string; lensLabel: string; scopeIds: string[]; factor: number }) {
  const { cashflows, snapshots, settings } = useVault();
  const [peakOpen, setPeakOpen] = useState(false);
  const heroPorts = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);
  const heroCash = useMemo(
    () => computeCashAmmo(snapshots, cashflows, heroPorts, scopeIds, factor),
    [snapshots, cashflows, heroPorts, scopeIds, factor]
  );
  const last = pts[pts.length - 1];
  const spark = pts.slice(-60);
  const up = stats.profit >= 0;

  // High-Water Mark (القمة التاريخية للمحفظة أو الحصة المختارة)
  const peakPt = useMemo(() => {
    if (!pts.length) return null;
    return pts.reduce((best, cur) => (cur.nav > best.nav ? cur : best), pts[0]);
  }, [pts]);
  const toPeak = peakPt && last ? Math.max(0, peakPt.nav - last.nav) : 0;
  const peakPct = peakPt && peakPt.nav > 0 ? Math.min(100, Math.max(0, (stats.nav / peakPt.nav) * 100)) : 100;
  const diffPctFromPeak = peakPt && peakPt.nav > 0 ? ((stats.nav - peakPt.nav) / peakPt.nav) * 100 : 0;

  // إجمالي الأرباح المجنية نقداً من المحفظة (جني أرباح + سداد الفيزا + أرباح الشريك)
  const harvestedCash = useMemo(() => {
    const harvestTags = new Set(['جني أرباح', 'سداد الفيزا', 'أرباح الشريك']);
    return cashflows
      .filter(c => !c.opening && !c.partner && c.type === 'withdrawal' && harvestTags.has(c.tag))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [cashflows]);

  const monthlyGainRate = stats.days >= 15 ? Math.round((stats.profit / stats.days) * 30) : null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      {spark.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-65" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area type="monotone" dataKey="nav" stroke={up ? '#34d399' : '#fb7185'} strokeWidth={2.5} fill="url(#heroSpark)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative">
        {(() => {
          const atPeak = Boolean(peakPt && toPeak <= 0);
          return (
            <>
              {/* Main Row: Right = Giant NAV + Cash chip | Left = Scope badges + Peak trophy */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span
                      dir="ltr"
                      className={cx(
                        'text-4xl sm:text-6xl font-black tabular-nums tracking-tight transition-all',
                        atPeak && 'bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                      )}
                    >
                      <CountUp value={stats.nav} format={n => fmt(n)} />
                    </span>
                    <span className="text-sm font-bold text-slate-400">ج.م</span>

                    <span className={cx('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black', up ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
                      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span dir="ltr">{fmtPct(stats.retPct)}</span>
                    </span>

                    {/* Offensive Cash Chip — icon + number only */}
                    <span
                      dir="ltr"
                      title={`${heroCash.postureLabel}`}
                      className={cx(
                        'inline-flex items-center gap-2 rounded-2xl border pl-1.5 pr-3 py-1 backdrop-blur-md shadow-lg',
                        heroCash.totalCash > 0
                          ? 'border-sky-400/35 bg-gradient-to-r from-sky-500/20 via-cyan-500/10 to-emerald-500/15 shadow-sky-500/10'
                          : 'border-white/10 bg-white/[0.04]'
                      )}
                    >
                      <span className={cx(
                        'flex h-7 w-7 items-center justify-center rounded-xl',
                        heroCash.totalCash > 0
                          ? 'bg-gradient-to-br from-sky-300 to-emerald-400 text-slate-950 shadow-md shadow-sky-400/30'
                          : 'bg-white/10 text-slate-400'
                      )}>
                        <Banknote className="w-4 h-4" />
                      </span>
                      <span className={cx('text-lg font-black tabular-nums tracking-tight', heroCash.totalCash > 0 ? 'text-sky-100' : 'text-slate-400')}>
                        {fmtCompact(heroCash.totalCash)}
                      </span>
                      <span className={cx('text-[11px] font-black tabular-nums', heroCash.totalCash > 0 ? 'text-emerald-300' : 'text-slate-500')}>
                        {heroCash.cashPct.toFixed(0)}%
                      </span>
                    </span>

                    {/* When Current Market Value is at/above Peak -> Trophy Victory Emblem */}
                    {atPeak && (
                      <span
                        title="القمة التاريخية"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-400/40 ring-2 ring-amber-300/40 animate-pulse"
                      >
                        <Trophy className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Left cluster: Peak trophy (or expanded card) + scope/date badges */}
                <div dir="ltr" className="flex flex-wrap items-start gap-2.5 lg:justify-start">
                  {peakPt && !peakOpen && (
                    <button
                      type="button"
                      onClick={() => setPeakOpen(true)}
                      title="اضغط للتفاصيل"
                      className={cx(
                        'group relative shrink-0 overflow-hidden rounded-2xl border px-3.5 py-2 backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg',
                        atPeak
                          ? 'border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-400/20 shadow-amber-500/15'
                          : 'border-amber-400/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-amber-400/45'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                          <svg width={36} height={36} className="absolute inset-0 -rotate-90">
                            <circle cx={18} cy={18} r={15.5} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2.5} />
                            <circle
                              cx={18}
                              cy={18}
                              r={15.5}
                              fill="none"
                              stroke={atPeak ? '#34d399' : '#fbbf24'}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 15.5}
                              strokeDashoffset={2 * Math.PI * 15.5 * (1 - peakPct / 100)}
                              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                            />
                          </svg>
                          <div className={cx(
                            'flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:scale-110',
                            atPeak
                              ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-emerald-400 text-slate-950 shadow-md shadow-amber-400/40'
                              : 'bg-gradient-to-br from-amber-400/25 to-orange-500/20 text-amber-300'
                          )}>
                            <Trophy className="w-3.5 h-3.5 drop-shadow" />
                          </div>
                        </div>
                        <span
                          className={cx(
                            'text-lg sm:text-xl font-black tabular-nums tracking-tight',
                            atPeak
                              ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-emerald-200 bg-clip-text text-transparent'
                              : 'text-white'
                          )}
                        >
                          {fmt(peakPt.nav)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cx(
                            'h-full rounded-full transition-all duration-700',
                            atPeak
                              ? 'bg-gradient-to-r from-amber-300 via-emerald-400 to-yellow-300'
                              : 'bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-300'
                          )}
                          style={{ width: `${peakPct}%` }}
                        />
                      </div>
                    </button>
                  )}

                  {peakPt && peakOpen && (
                    <div
                      onClick={() => setPeakOpen(false)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPeakOpen(false); }}
                      title="اضغط لإغلاق التفاصيل"
                      className="w-full sm:w-[340px] cursor-pointer rounded-2xl border border-amber-400/30 bg-slate-900/85 hover:bg-slate-900/95 backdrop-blur-xl p-3.5 space-y-3 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-black text-amber-300">
                            <Trophy className="w-3.5 h-3.5 shrink-0" />
                            <b className="text-white tabular-nums font-black text-sm">{fmt(peakPt.nav)}</b>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={cx(
                              'rounded-full px-2 py-0.5 text-[10px] font-black',
                              toPeak > 0 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                            )}>
                              {toPeak > 0 ? `-${fmtCompact(toPeak)} (${diffPctFromPeak.toFixed(1)}%) · ${peakPct.toFixed(0)}%` : '100% 🏆'}
                            </span>
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-300 transition-all duration-700"
                            style={{ width: `${peakPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-2.5 py-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                            <Banknote className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                            <span>جني نقدي</span>
                          </span>
                          <b className="text-xs font-black tabular-nums text-emerald-300">+{fmtCompact(harvestedCash)}</b>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-2.5 py-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span>شهرياً</span>
                          </span>
                          <b className={cx('text-xs font-black tabular-nums', (monthlyGainRate ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                            {monthlyGainRate !== null ? fmtCompact(monthlyGainRate) : '—'}
                          </b>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scope / lens / date — compact, moved to the left */}
                  <div dir="rtl" className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-black pt-1">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">{scopeLabel}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">{lensLabel}</span>
                    {last && <span className="text-slate-400 font-bold">{fmtDate(last.date)}</span>}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Bottom 4 KPIs — Unobstructed over the Glowing Sparkline Chart */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <Mini label="صافي الإيداعات" value={fmt(stats.netDeposits)} />
          <Mini label="إجمالي العوائد" value={fmtSigned(stats.profit)} color={up ? 'text-emerald-300' : 'text-rose-300'} />
          <Mini label="العائد الزمني (TWR)" value={fmtPct(stats.twrPct)} color={stats.twrPct >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
          <Mini label="العائد السنوي المركب" value={stats.annualized === null ? '—' : fmtPct(stats.annualized, 1)} color={(stats.annualized ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div dir="ltr" className={cx('mt-0.5 text-lg sm:text-xl font-black tabular-nums text-right', color)}>{value}</div>
    </div>
  );
}

export function MainChart({ pts, accent = '#f97316', dir = 'rtl' }: { pts: Point[]; accent?: string; dir?: 'rtl' | 'ltr' }) {
  const { settings, saveSettings } = useVault();
  const [mode, setMode] = useState<Mode>('capital');
  const [period, setPeriod] = useState<Period>('3M');
  const [unit, setUnit] = useState<'egp' | 'pct'>('egp');
  const [bench, setBench] = useState<BenchmarksState>(() => loadCachedBenchmarks());
  const [syncingBench, setSyncingBench] = useState(false);
  const [bankRate, setBankRate] = useState<number>(() => {
    if (settings.bankRate && settings.bankRate > 0 && settings.bankRate <= 100) return settings.bankRate;
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return !isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27;
  });
  const [customBankStr, setCustomBankStr] = useState<string>(() => {
    if (settings.bankRate && settings.bankRate > 0 && settings.bankRate <= 100) return String(settings.bankRate);
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return String(!isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27);
  });
  const [showLines, setShowLines] = useState<{ bank: boolean; egx30: boolean; egx70: boolean }>({
    bank: true,
    egx30: true,
    egx70: true,
  });
  const [capZoom, setCapZoom] = useState<boolean>(true);

  const applyBankRate = (r: number) => {
    const clamped = Math.max(0, Math.min(100, r));
    setBankRate(clamped);
    setCustomBankStr(String(clamped));
    try {
      localStorage.setItem('egx_vault_bank_rate', String(clamped));
    } catch {
      // ignore
    }
    saveSettings({ ...settings, bankRate: clamped }).catch(() => {});
  };

  useEffect(() => {
    let mounted = true;
    setSyncingBench(true);
    fetchEgxBenchmarks().then(b => {
      if (mounted) {
        setBench(b);
        setSyncingBench(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshBench = async () => {
    setSyncingBench(true);
    const b = await fetchEgxBenchmarks();
    setBench(b);
    setSyncingBench(false);
  };

  const data = useMemo(() => windowSeries(pts, period, dir), [pts, period, dir]);
  const benchData = useMemo(() => buildBenchmarkSeries(data, bench, bankRate, dir), [data, bench, bankRate, dir]);
  const first = dir === 'rtl' ? data[data.length - 1] : data[0];
  const last = dir === 'rtl' ? data[0] : data[data.length - 1];
  const lastBench = dir === 'rtl' ? benchData[0] : benchData[benchData.length - 1];

  // بيانات الأداء الشهري (أعمدة ربح/تصحيح كل شهر بالجنيه والنسبة المئوية)
  const monthBars = useMemo<PeriodRet[]>(() => {
    const allM = monthlyReturns(pts);
    return dir === 'rtl' ? [...allM].reverse() : allM;
  }, [pts, dir]);

  // أعلى قمة عوائد داخل الفترة المختارة (لرسم خط قمة الأرباح)
  const peakProfitInWin = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map(d => (unit === 'egp' ? d.pProfit : d.pTwr)));
  }, [data, unit]);

  // أعلى قمة للقيمة السوقية داخل الفترة المختارة (لرسم خط القمة في شارت رأس المال)
  const peakNavInWin = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map(d => d.nav));
  }, [data]);

  // إحصائيات تفكيك حركات الفترة في شارت رأس المال (غير مكررة مع الهيدر العلوي)
  const capPeriodMeta = useMemo(() => {
    if (!data.length || !first || !last) return null;
    // مرتبة زمنياً من الأقدم للأحدث لحساب عمليات الإيداع والسحب وأيام التربح فوق رأس المال
    const chrono = dir === 'rtl' ? [...data].reverse() : data;
    let depAdded = 0;
    let depWithdrawn = 0;
    let depEvents = 0;
    let aboveCapitalPoints = 0;
    let minNav = Infinity;
    let minNavDate = '';
    let maxNavDate = '';

    chrono.forEach((pt, idx) => {
      if (pt.nav >= pt.deposits) aboveCapitalPoints++;
      if (pt.nav < minNav) {
        minNav = pt.nav;
        minNavDate = pt.date;
      }
      if (pt.nav === peakNavInWin) {
        maxNavDate = pt.date;
      }
      if (idx > 0) {
        const diffDep = pt.deposits - chrono[idx - 1].deposits;
        if (Math.abs(diffDep) >= 1) {
          depEvents++;
          if (diffDep > 0) depAdded += diffDep;
          else depWithdrawn += Math.abs(diffDep);
        }
      }
    });

    const netFlow = last.deposits - first.deposits;
    const navDelta = last.nav - first.nav;
    const marketGainInPeriod = navDelta - netFlow; // ربح/خسارة السوق الصافية داخل الفترة بمعزل عن الإيداعات
    const abovePct = chrono.length ? Math.round((aboveCapitalPoints / chrono.length) * 100) : 100;
    const capMultiple = last.deposits > 0 ? last.nav / last.deposits : 1;

    return {
      navDelta,
      netFlow,
      depAdded,
      depWithdrawn,
      depEvents,
      marketGainInPeriod,
      abovePct,
      capMultiple,
      minNav: minNav === Infinity ? 0 : minNav,
      minNavDate,
      maxNavDate,
    };
  }, [data, first, last, dir, peakNavInWin]);

  const growthKey = unit === 'egp' ? 'pProfit' : 'pTwr';
  const off = mode === 'growth' ? splitOffset(data.map(d => d[growthKey])) : 1;

  return (
    <Card
      title="تحليل الأداء"
      right={
        <Segmented
          size="sm"
          value={mode}
          onChange={v => {
            setMode(v);
            if (v === 'benchmark') setUnit('pct');
          }}
          options={[
            { v: 'capital', label: 'رأس المال' },
            { v: 'growth', label: 'العوائد والنمو' },
            { v: 'benchmark', label: 'مقارنة السوق' },
            { v: 'monthly', label: 'شهرياً' },
            { v: 'dd', label: 'الهبوط' },
          ]}
        />
      }
    >
      {!data.length ? (
        <Empty icon={<Activity className="w-10 h-10" />} text="سجّل أول قيمة سوقية لتظهر الرسوم" />
      ) : (
        <>
          {/* Header Area — Rich Dual Metrics without Redundancy */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            {mode === 'capital' && last && first && capPeriodMeta && (
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
                {/* Right side: Non-Redundant Period Attribution Pills (No repeat of Total NAV / Total Deposits / Total Profit) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  {/* 1. صافي تغير الفترة وتفكيك مصدره (سوق أم إيداعات) */}
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] px-2.5 py-1">
                    <span className="text-slate-400">تغير ({period === 'All' ? 'الكل' : period}):</span>
                    <b dir="ltr" className={cx('tabular-nums font-black', tone(capPeriodMeta.navDelta))}>
                      {fmtSigned(capPeriodMeta.navDelta)} ج.م
                    </b>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      سوق:{' '}
                      <b dir="ltr" className={tone(capPeriodMeta.marketGainInPeriod)}>
                        {fmtSigned(capPeriodMeta.marketGainInPeriod)}
                      </b>
                    </span>
                    {Math.abs(capPeriodMeta.netFlow) >= 1 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-[10px] text-indigo-500">
                          ضخ صافي: <b dir="ltr">{fmtSigned(capPeriodMeta.netFlow)}</b>
                        </span>
                      </>
                    )}
                  </div>

                  {/* 2. نطاق الفترة (القاع ⬅️ القمة مع تاريخ القمة) */}
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/25 px-2.5 py-1">
                    <span className="text-amber-600 dark:text-amber-400">نطاق الفترة:</span>
                    <span dir="ltr" className="text-slate-500 dark:text-slate-300 font-black tabular-nums">
                      {fmtCompact(capPeriodMeta.minNav)} ➔ {fmtCompact(peakNavInWin)}
                    </span>
                    {capPeriodMeta.maxNavDate && (
                      <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                        (قمة {shortDate(capPeriodMeta.maxNavDate)})
                      </span>
                    )}
                  </div>

                  {/* 3. مضاعف رأس المال + نسبة البقاء في المنطقة الرابحة فوق الإيداعات */}
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 px-2.5 py-1">
                    <span className="text-slate-400">مضاعف الإيداع:</span>
                    <b dir="ltr" className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums">
                      {capPeriodMeta.capMultiple.toFixed(2)}x
                    </b>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      فوق الإيداعات: <b dir="ltr" className="text-emerald-500">{capPeriodMeta.abovePct}%</b> من الفترة
                    </span>
                  </div>
                </div>

                {/* Left side: Legend + Smart Auto-Zoom Toggle in same compact bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="hidden xl:flex items-center gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <i className="w-2 h-2 rounded-full" style={{ background: accent }} />
                      السوقية
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="w-2 h-2 rounded-full bg-indigo-400" />
                      الإيداعات
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <i className="w-3.5 h-0 border-t-2 border-dashed border-amber-500 inline-block" />
                      القمة
                    </span>
                  </div>

                  <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => setCapZoom(true)}
                      className={cx(
                        'px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition',
                        capZoom ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                      )}
                    >
                      مُركّز (Zoom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapZoom(false)}
                      className={cx(
                        'px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition',
                        !capZoom ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                      )}
                    >
                      شامل + العوائد
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'growth' && last && (
              <>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">
                    {period === 'All' ? 'إجمالي العوائد التراكمية والنمو منذ البداية' : `تغير العوائد والنمو خلال الفترة (${period})`}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                    <span dir="ltr" className={cx('text-2xl font-black tabular-nums', tone(last.pProfit))}>
                      {fmtSigned(last.pProfit)} ج.م
                    </span>
                    <span dir="ltr" className={cx('rounded-lg px-2 py-0.5 text-xs font-black', last.pTwr >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                      {fmtPct(last.pTwr)}
                    </span>
                  </div>
                  {period !== 'All' && (
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                      الإجمالي منذ البداية: <b dir="ltr" className={tone(last.profit)}>{fmtSigned(last.profit)} ج.م ({fmtPct((last.index - 1) * 100)})</b>
                    </div>
                  )}
                </div>

                {/* Quick Toggle between EGP Curve and % Curve */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-black">
                    <button
                      type="button"
                      onClick={() => setUnit('egp')}
                      className={cx(
                        'rounded-lg px-2.5 py-1 transition',
                        unit === 'egp' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                      )}
                    >
                      بالجنيه (ج.م)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('pct')}
                      className={cx(
                        'rounded-lg px-2.5 py-1 transition',
                        unit === 'pct' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                      )}
                    >
                      بالنسبة (%)
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'benchmark' && lastBench && (
              <div className="w-full space-y-3">
                {/* Top Controls Row: Series Toggles + Bank Rate (Presets + Manual Input) + Unit Switch + Live Sync */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      محفظتي
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowLines(s => ({ ...s, bank: !s.bank }))}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-black transition',
                        showLines.bank
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                      )}
                    >
                      <i className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      عائد البنك ({bankRate}%)
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLines(s => ({ ...s, egx30: !s.egx30 }))}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-black transition',
                        showLines.egx30
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                      )}
                    >
                      <i className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      EGX30 ({fmt(bench.egx30.close, 0)})
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLines(s => ({ ...s, egx70: !s.egx70 }))}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-black transition',
                        showLines.egx70
                          ? 'bg-pink-500/15 border-pink-500/40 text-pink-600 dark:text-pink-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                      )}
                    >
                      <i className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      EGX70 ({fmt(bench.egx70.close, 0)})
                    </button>

                    <button
                      type="button"
                      onClick={refreshBench}
                      title="تحديث المؤشرات مباشرة من البورصة المصرية"
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <RefreshCw className={cx('w-3 h-3', syncingBench && 'animate-spin text-emerald-500')} />
                      <span>{bench.live ? 'مباشر' : 'تحديث'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bank Annual Rate Pills + Manual Input */}
                    <div className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-black">
                      <Landmark className="w-3 h-3 text-amber-500 mx-1" />
                      {[20, 24, 27].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => applyBankRate(r)}
                          className={cx(
                            'rounded-lg px-2 py-1 transition',
                            bankRate === r ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          )}
                        >
                          {r}%
                        </button>
                      ))}
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg px-1.5 py-0.5 border border-slate-200/80 dark:border-slate-700 ml-0.5">
                        <input
                          type="number"
                          dir="ltr"
                          min={0}
                          max={100}
                          step={0.5}
                          value={customBankStr}
                          onChange={e => {
                            setCustomBankStr(e.target.value);
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v >= 0 && v <= 100) {
                              setBankRate(v);
                              try {
                                localStorage.setItem('egx_vault_bank_rate', String(v));
                              } catch {
                                // ignore
                              }
                            }
                          }}
                          title="أدخل نسبة فائدة البنك يدوياً"
                          className="w-10 bg-transparent text-center text-[11px] font-black text-amber-600 dark:text-amber-400 focus:outline-none tabular-nums"
                        />
                        <span className="text-[9px] text-slate-400">%</span>
                      </div>
                    </div>

                    {/* Unit Toggle (% vs EGP) */}
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-black">
                      <button
                        type="button"
                        onClick={() => setUnit('pct')}
                        className={cx(
                          'rounded-lg px-2.5 py-1 transition',
                          unit === 'pct' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                        )}
                      >
                        بالنسبة (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit('egp')}
                        className={cx(
                          'rounded-lg px-2.5 py-1 transition',
                          unit === 'egp' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                        )}
                      >
                        بالجنيه (ج.م)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Crystal-Clear Comparison Cards: Actual Return as Big Number + Explicit Winner Badge */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* 1. My Portfolio */}
                  <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.06] p-3 flex flex-col justify-between gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        أداء محفظتي
                      </span>
                      <span dir="ltr" className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px]">
                        {period === 'All' ? 'الكل' : period}
                      </span>
                    </div>
                    <div>
                      <div dir="ltr" className={cx('text-xl font-black tabular-nums text-right', tone(lastBench.pTwr))}>
                        {unit === 'pct' ? fmtPct(lastBench.pTwr) : `${fmtSigned(lastBench.pProfit)} ج.م`}
                      </div>
                      <div dir="ltr" className="text-[11px] font-black text-slate-500 dark:text-slate-400 text-right">
                        {unit === 'pct' ? `${fmtSigned(lastBench.pProfit)} ج.م` : fmtPct(lastBench.pTwr)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-900/5 dark:bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-500 dark:text-slate-300 flex items-center justify-between">
                      <span>المرجع الأساسي</span>
                      <span dir="ltr">{fmt(lastBench.nav)} ج.م</span>
                    </div>
                  </div>

                  {/* 2. Bank Benchmark */}
                  {(() => {
                    const diffPct = lastBench.pTwr - lastBench.bankPct;
                    const diffEgp = lastBench.pProfit - lastBench.bankProfit;
                    const iWin = diffPct >= 0;
                    return (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-3 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-amber-600 dark:text-amber-400">
                          <span className="flex items-center gap-1.5">
                            <i className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            لو في البنك ({bankRate}%)
                          </span>
                          <span className="text-[9px] text-slate-400">عائد الفترة</span>
                        </div>
                        <div>
                          <div dir="ltr" className="text-xl font-black tabular-nums text-right text-amber-600 dark:text-amber-400">
                            {unit === 'pct' ? fmtPct(lastBench.bankPct) : `${fmtSigned(lastBench.bankProfit)} ج.م`}
                          </div>
                          <div dir="ltr" className="text-[11px] font-black text-slate-500 dark:text-slate-400 text-right">
                            {unit === 'pct' ? `${fmtSigned(lastBench.bankProfit)} ج.م` : fmtPct(lastBench.bankPct)}
                          </div>
                        </div>
                        <div
                          className={cx(
                            'rounded-xl px-2.5 py-1 text-[10px] font-black flex items-center justify-between',
                            iWin
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          <span>{iWin ? '✓ أنت متفوق بـ' : 'البنك متفوق بـ'}</span>
                          <b dir="ltr">
                            {unit === 'pct'
                              ? `+${Math.abs(diffPct).toFixed(1)}% (${fmtCompact(Math.abs(diffEgp))})`
                              : `+${fmt(Math.abs(diffEgp))} (${Math.abs(diffPct).toFixed(1)}%)`}
                          </b>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. EGX30 Benchmark */}
                  {(() => {
                    const diffPct = lastBench.pTwr - lastBench.egx30Pct;
                    const diffEgp = lastBench.pProfit - lastBench.egx30Profit;
                    const iWin = diffPct >= 0;
                    return (
                      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] p-3 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-sky-600 dark:text-sky-400">
                          <span className="flex items-center gap-1.5">
                            <i className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                            مؤشر EGX30
                          </span>
                          <span className="text-[9px] text-slate-400">أداء المؤشر</span>
                        </div>
                        <div>
                          <div dir="ltr" className={cx('text-xl font-black tabular-nums text-right', tone(lastBench.egx30Pct))}>
                            {unit === 'pct' ? fmtPct(lastBench.egx30Pct) : `${fmtSigned(lastBench.egx30Profit)} ج.م`}
                          </div>
                          <div dir="ltr" className="text-[11px] font-black text-slate-500 dark:text-slate-400 text-right">
                            {unit === 'pct' ? `${fmtSigned(lastBench.egx30Profit)} ج.م` : fmtPct(lastBench.egx30Pct)}
                          </div>
                        </div>
                        <div
                          className={cx(
                            'rounded-xl px-2.5 py-1 text-[10px] font-black flex items-center justify-between',
                            iWin
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          <span>{iWin ? '✓ أنت متفوق بـ' : 'EGX30 متفوق بـ'}</span>
                          <b dir="ltr">
                            {unit === 'pct'
                              ? `+${Math.abs(diffPct).toFixed(1)}% (${fmtCompact(Math.abs(diffEgp))})`
                              : `+${fmt(Math.abs(diffEgp))} (${Math.abs(diffPct).toFixed(1)}%)`}
                          </b>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. EGX70 Benchmark */}
                  {(() => {
                    const diffPct = lastBench.pTwr - lastBench.egx70Pct;
                    const diffEgp = lastBench.pProfit - lastBench.egx70Profit;
                    const iWin = diffPct >= 0;
                    return (
                      <div className="rounded-2xl border border-pink-500/30 bg-pink-500/[0.05] p-3 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-pink-600 dark:text-pink-400">
                          <span className="flex items-center gap-1.5">
                            <i className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                            مؤشر EGX70
                          </span>
                          <span className="text-[9px] text-slate-400">أداء المؤشر</span>
                        </div>
                        <div>
                          <div dir="ltr" className={cx('text-xl font-black tabular-nums text-right', tone(lastBench.egx70Pct))}>
                            {unit === 'pct' ? fmtPct(lastBench.egx70Pct) : `${fmtSigned(lastBench.egx70Profit)} ج.م`}
                          </div>
                          <div dir="ltr" className="text-[11px] font-black text-slate-500 dark:text-slate-400 text-right">
                            {unit === 'pct' ? `${fmtSigned(lastBench.egx70Profit)} ج.م` : fmtPct(lastBench.egx70Pct)}
                          </div>
                        </div>
                        <div
                          className={cx(
                            'rounded-xl px-2.5 py-1 text-[10px] font-black flex items-center justify-between',
                            iWin
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          <span>{iWin ? '✓ أنت متفوق بـ' : 'EGX70 متفوق بـ'}</span>
                          <b dir="ltr">
                            {unit === 'pct'
                              ? `+${Math.abs(diffPct).toFixed(1)}% (${fmtCompact(Math.abs(diffEgp))})`
                              : `+${fmt(Math.abs(diffEgp))} (${Math.abs(diffPct).toFixed(1)}%)`}
                          </b>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {mode === 'monthly' && (
              <>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">صافي أرباح وتصحيحات كل شهر</div>
                  <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {monthBars.filter(m => m.gain >= 0).length} شهور رابحة
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      من أصل {monthBars.length} شهر
                    </span>
                  </div>
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => setUnit('egp')}
                    className={cx(
                      'rounded-lg px-2.5 py-1 transition',
                      unit === 'egp' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                    )}
                  >
                    بالجنيه (ج.م)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('pct')}
                    className={cx(
                      'rounded-lg px-2.5 py-1 transition',
                      unit === 'pct' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
                    )}
                  >
                    بالنسبة (%)
                  </button>
                </div>
              </>
            )}

            {mode === 'dd' && last && (
              <div>
                <div className="text-[11px] font-bold text-slate-400">أقصى هبوط بالفترة ({period === 'All' ? 'الكل' : period})</div>
                <div dir="ltr" className="text-2xl font-black tabular-nums text-rose-500 text-right mt-0.5">
                  {fmtPct(Math.min(...data.map(d => d.pDd)))}
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                  الهبوط الحالي من القمة: <b dir="ltr" className="text-rose-400">{fmtPct(last.pDd)}</b>
                </div>
              </div>
            )}
          </div>

          {/* Chart Canvas */}
          <div dir="ltr" className="h-72 sm:h-80 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'capital' ? (
                <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNav" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={0.35} /><stop offset="100%" stopColor={accent} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.22} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gProfCap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.18} /><stop offset="100%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis
                    orientation="right"
                    tickFormatter={fmtCompact}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    domain={
                      capZoom
                        ? [
                            (dataMin: number) => Math.max(0, Math.floor((dataMin * 0.95) / 10000) * 10000),
                            (dataMax: number) => Math.ceil((dataMax * 1.02) / 10000) * 10000,
                          ]
                        : ['auto', 'auto']
                    }
                  />
                  {peakNavInWin > 0 && (
                    <ReferenceLine
                      y={peakNavInWin}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      strokeOpacity={0.95}
                      label={{
                        value: `قمة الفترة: ${fmt(peakNavInWin)}`,
                        position: 'insideTopLeft',
                        fill: '#d97706',
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    />
                  )}
                  <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} content={<ChartTip labelFmt={fmtDate} rows={p => [
                    { name: 'القيمة السوقية', value: `${fmt(+p.nav)} ج.م`, color: accent },
                    { name: 'صافي الإيداعات', value: `${fmt(+p.deposits)} ج.م (${+p.nav > 0 ? ((+p.deposits / +p.nav) * 100).toFixed(0) : 100}%)`, color: '#818cf8' },
                    { name: 'الفائض الربحي التراكمي', value: `${fmtSigned(+p.profit)} ج.م (${fmtPct((+p.index - 1) * 100, 1)})`, color: +p.profit >= 0 ? '#34d399' : '#fb7185' },
                    { name: 'الفارق عن قمة الفترة', value: +p.nav >= peakNavInWin ? 'قمة الفترة 🏆' : `${fmtSigned(+p.nav - peakNavInWin)} ج.م (${peakNavInWin > 0 ? (((+p.nav - peakNavInWin) / peakNavInWin) * 100).toFixed(1) : 0}%)`, color: '#fbbf24' },
                  ]} />} />
                  <Area type="stepAfter" dataKey="deposits" stroke="#818cf8" strokeWidth={2} fill="url(#gDep)" dot={false} />
                  {!capZoom && (
                    <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#gProfCap)" dot={false} />
                  )}
                  <Area type="monotone" dataKey="nav" stroke={accent} strokeWidth={2.5} fill="url(#gNav)" dot={data.length < 25 ? { r: 3, fill: accent } : false} activeDot={{ r: 5 }} />
                </ComposedChart>
              ) : mode === 'benchmark' ? (
                <ComposedChart data={benchData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBenchMine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis
                    orientation="right"
                    tickFormatter={unit === 'egp' ? fmtCompact : (v: number) => `${v.toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.45} />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                    content={
                      <ChartTip
                        labelFmt={fmtDate}
                        rows={p => [
                          {
                            name: 'أداء محفظتي',
                            value: `${fmtPct(+p.pTwr)} (${fmtSigned(+p.pProfit)} ج.م)`,
                            color: '#10b981',
                          },
                          ...(showLines.bank
                            ? [
                                {
                                  name: `عائد البنك (${bankRate}%)`,
                                  value: `${fmtPct(+p.bankPct)} (${fmtSigned(+p.bankProfit)} ج.م)`,
                                  color: '#f59e0b',
                                },
                              ]
                            : []),
                          ...(showLines.egx30
                            ? [
                                {
                                  name: 'مؤشر EGX30',
                                  value: `${fmtPct(+p.egx30Pct)} (${fmtSigned(+p.egx30Profit)} ج.م)`,
                                  color: '#0ea5e9',
                                },
                              ]
                            : []),
                          ...(showLines.egx70
                            ? [
                                {
                                  name: 'مؤشر EGX70',
                                  value: `${fmtPct(+p.egx70Pct)} (${fmtSigned(+p.egx70Profit)} ج.م)`,
                                  color: '#ec4899',
                                },
                              ]
                            : []),
                        ]}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={unit === 'egp' ? 'pProfit' : 'pTwr'}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gBenchMine)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  {showLines.bank && (
                    <Line
                      type="monotone"
                      dataKey={unit === 'egp' ? 'bankProfit' : 'bankPct'}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                    />
                  )}
                  {showLines.egx30 && (
                    <Line
                      type="monotone"
                      dataKey={unit === 'egp' ? 'egx30Profit' : 'egx30Pct'}
                      stroke="#0ea5e9"
                      strokeWidth={2.2}
                      dot={false}
                    />
                  )}
                  {showLines.egx70 && (
                    <Line
                      type="monotone"
                      dataKey={unit === 'egp' ? 'egx70Profit' : 'egx70Pct'}
                      stroke="#ec4899"
                      strokeWidth={2.2}
                      dot={false}
                    />
                  )}
                </ComposedChart>
              ) : mode === 'monthly' ? (
                <BarChart data={monthBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis
                    dataKey="key"
                    tickFormatter={(k: string) => `${MONTHS_EN[+k.slice(5, 7) - 1]} ${k.slice(2, 4)}`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    orientation="right"
                    tickFormatter={unit === 'egp' ? fmtCompact : (v: number) => `${v.toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.45} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                    content={
                      <ChartTip
                        labelFmt={monthLabel}
                        rows={p => [
                          { name: 'عائد الشهر (ج.م)', value: `${fmtSigned(+p.gain)} ج.م`, color: +p.gain >= 0 ? '#34d399' : '#fb7185' },
                          { name: 'نسبة نمو الشهر (%)', value: fmtPct(+p.pct), color: +p.pct >= 0 ? '#10b981' : '#f43f5e' },
                          { name: 'القيمة بنهاية الشهر', value: `${fmt(+p.endNav)} ج.م`, color: '#818cf8' },
                        ]}
                      />
                    }
                  />
                  <Bar dataKey={unit === 'egp' ? 'gain' : 'pct'} radius={[6, 6, 0, 0]} maxBarSize={34}>
                    {monthBars.map(m => (
                      <Cell key={m.key} fill={m.gain >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSplitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={0} stopColor={mode === 'dd' ? '#fb7185' : '#34d399'} stopOpacity={0.4} />
                      <stop offset={off} stopColor={mode === 'dd' ? '#fb7185' : '#34d399'} stopOpacity={0.05} />
                      <stop offset={off} stopColor="#fb7185" stopOpacity={0.05} />
                      <stop offset={1} stopColor="#fb7185" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gSplitStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor={mode === 'dd' ? '#fb7185' : '#10b981'} />
                      <stop offset={off} stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis
                    orientation="right"
                    tickFormatter={mode === 'growth' && unit === 'egp' ? fmtCompact : (v: number) => `${v.toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.5} />
                  {mode === 'growth' && peakProfitInWin > 0 && (
                    <ReferenceLine
                      y={peakProfitInWin}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      strokeOpacity={0.95}
                      label={{
                        value: `القمة: ${unit === 'egp' ? fmtSigned(peakProfitInWin) : fmtPct(peakProfitInWin)}`,
                        position: 'insideTopLeft',
                        fill: '#d97706',
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                    content={
                      <ChartTip
                        labelFmt={fmtDate}
                        rows={p =>
                          mode === 'growth'
                            ? [
                                { name: period === 'All' ? 'إجمالي العوائد (ج.م)' : `عوائد الفترة (${period})`, value: `${fmtSigned(+p.pProfit)} ج.م`, color: +p.pProfit >= 0 ? '#34d399' : '#fb7185' },
                                { name: period === 'All' ? 'إجمالي النمو (%)' : `نمو الفترة (${period})`, value: fmtPct(+p.pTwr), color: +p.pTwr >= 0 ? '#10b981' : '#f43f5e' },
                                ...(period !== 'All'
                                  ? [{ name: 'إجمالي العوائد منذ البداية', value: `${fmtSigned(+p.profit)} ج.م (${fmtPct((+p.index - 1) * 100)})`, color: '#818cf8' }]
                                  : []),
                              ]
                            : [{ name: 'الهبوط من القمة', value: fmtPct(+p.pDd), color: '#fb7185' }]
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={mode === 'growth' ? growthKey : 'pDd'}
                    stroke={mode === 'dd' ? '#fb7185' : 'url(#gSplitStroke)'}
                    strokeWidth={2.5}
                    fill="url(#gSplitFill)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {mode !== 'monthly' && (
            <>
              <div className="mt-4 flex justify-center">
                <Segmented value={period} onChange={setPeriod} options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))} />
              </div>
              {first && last && first.date !== last.date && (
                <div className="mt-3 text-center text-[11px] font-bold text-slate-400">{fmtDate(first.date)} ← {fmtDate(last.date)}</div>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
}

/* ───────── Portfolio Distribution & Future Performance Forecast Engine (Zero Redundancy) ───────── */
export function WealthGrowthDecomposition({
  stats,
  scopeIds,
  factor = 1,
  onFocusPortfolio,
  onOpenSnap,
}: {
  stats?: Stats;
  lensLabel?: string;
  scopeIds?: string[];
  factor?: number;
  onFocusPortfolio?: (pid: string) => void;
  onOpenSnap?: () => void;
}) {
  const { settings, snapshots, cashflows } = useVault();
  const activePorts = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);

  // 1. ترتيب المحافظ وحصتها في القيمة السوقية والعوائد
  const portRows = useMemo(
    () => comparePortfolios(snapshots, cashflows, activePorts).sort((a, b) => b.stats.nav - a.stats.nav),
    [snapshots, cashflows, activePorts]
  );

  // 1.b حساب رادار الكاش الهجومي المتاح عبر كل المحافظ (كجزء من الإجمالي)
  const cashAmmo = useMemo(
    () => computeCashAmmo(snapshots, cashflows, activePorts, scopeIds, factor),
    [snapshots, cashflows, activePorts, scopeIds, factor]
  );

  // 2. معادلة الملكية الخالصة المدمجة (حصتي مقابل الشريك)
  const ownership = useMemo(() => {
    const totalNav = portRows.reduce((sum, r) => sum + r.stats.nav, 0);
    const totalDep = portRows.reduce((sum, r) => sum + r.stats.netDeposits, 0);
    const partnerCap = settings.partner.enabled ? (settings.partner.partnerCapital ?? 570000) : 0;
    const myNav = Math.max(0, totalNav - partnerCap);
    const myDep = Math.max(0, totalDep - partnerCap);
    const myProfit = myNav - myDep;
    const myRetPct = myDep > 0 ? (myProfit / myDep) * 100 : 0;
    const mySharePct = totalNav > 0 ? (myNav / totalNav) * 100 : 100;
    const partnerSharePct = totalNav > 0 ? Math.min(100, (partnerCap / totalNav) * 100) : 0;
    const coveragePct = partnerCap > 0 ? (totalNav / partnerCap) * 100 : 100;
    return { totalNav, partnerCap, myNav, myDep, myProfit, myRetPct, mySharePct, partnerSharePct, coveragePct };
  }, [portRows, settings.partner]);

  // 3. وتيرة الأداء الحقيقية المسجلة (Velocity & Run-rate)
  const avgMonthlyGainEgp = useMemo(() => {
    if (stats?.months && stats.months.length > 0) {
      const totalGains = stats.months.reduce((acc, m) => acc + m.gain, 0);
      return Math.round(totalGains / stats.months.length);
    }
    const days = stats?.days ?? 365;
    const prof = stats?.profit ?? 0;
    return Math.round(prof / Math.max(1, days / 30.4));
  }, [stats]);

  const effectiveCagr = useMemo(() => {
    if (stats?.annualized !== null && stats?.annualized !== undefined && Number.isFinite(stats.annualized)) {
      return stats.annualized;
    }
    if (stats && stats.twrPct > 0 && stats.days > 0) {
      return ((1 + stats.twrPct / 100) ** (365 / Math.max(30, stats.days)) - 1) * 100;
    }
    return 22.2;
  }, [stats]);

  const yearsToDouble = useMemo(() => {
    const r = effectiveCagr > 0 ? effectiveCagr : 20;
    const yrs = Math.log(2) / Math.log(1 + r / 100);
    return Number.isFinite(yrs) && yrs > 0 ? yrs : 3.5;
  }, [effectiveCagr]);

  // 4. محاكي التوقعات المستقبلية ومسار الثروة
  const [horizon, setHorizon] = useState<'6M' | '1Y' | '2Y' | '3Y'>('1Y');
  const [customRate, setCustomRate] = useState<number>(() => {
    const defaultRate = Math.round(effectiveCagr > 0 ? effectiveCagr : 22);
    return Math.max(5, Math.min(60, defaultRate));
  });

  const horizonYears = useMemo(() => {
    switch (horizon) {
      case '6M': return 0.5;
      case '1Y': return 1.0;
      case '2Y': return 2.0;
      case '3Y': return 3.0;
      default: return 1.0;
    }
  }, [horizon]);

  const horizonLabel = useMemo(() => {
    switch (horizon) {
      case '6M': return '6 شهور';
      case '1Y': return 'سنة كاملة';
      case '2Y': return 'سنتين';
      case '3Y': return '3 سنوات';
      default: return 'سنة';
    }
  }, [horizon]);

  const currentNav = useMemo(() => {
    if (stats?.nav && stats.nav > 0) return stats.nav;
    return portRows.reduce((sum, r) => sum + r.stats.nav, 0) * factor;
  }, [stats, portRows, factor]);

  const futureNav = useMemo(() => {
    return Math.round(currentNav * Math.pow(1 + customRate / 100, horizonYears));
  }, [currentNav, customRate, horizonYears]);

  const projectedGain = useMemo(() => futureNav - currentNav, [futureNav, currentNav]);
  const projectedGainPct = useMemo(() => (currentNav > 0 ? (projectedGain / currentNav) * 100 : 0), [projectedGain, currentNav]);
  const projectedMonthlyGain = useMemo(() => Math.round(projectedGain / (horizonYears * 12)), [projectedGain, horizonYears]);

  // تطور حصتي الخالصة في المستقبل أمام رأس مال الشريك الثابت
  const projectedOwnership = useMemo(() => {
    const partnerCap = settings.partner.enabled ? (settings.partner.partnerCapital ?? 570000) : 0;
    const myFutureNav = Math.max(0, futureNav - partnerCap);
    const myFutureSharePct = futureNav > 0 ? (myFutureNav / futureNav) * 100 : 100;
    return { myFutureNav, myFutureSharePct, partnerCap };
  }, [futureNav, settings.partner]);

  // 5. حسابات اتساق الأداء السنوي والكلي مقربة بدقة
  const currentYear = useMemo(() => {
    if (stats?.months && stats.months.length > 0) {
      return stats.months[stats.months.length - 1].key.slice(0, 4);
    }
    return new Date().getFullYear().toString();
  }, [stats]);

  const yearMonths = useMemo(() => {
    if (!stats?.months) return [];
    return stats.months.filter(m => m.key.startsWith(currentYear));
  }, [stats, currentYear]);

  const yearWinningMonths = useMemo(() => {
    return yearMonths.filter(m => m.gain >= 0).length;
  }, [yearMonths]);

  const yearWinRate = useMemo(() => {
    return yearMonths.length > 0 ? Math.round((yearWinningMonths / yearMonths.length) * 100) : 0;
  }, [yearWinningMonths, yearMonths]);

  const allWinningMonths = useMemo(() => {
    return stats?.months ? stats.months.filter(m => m.gain >= 0).length : 0;
  }, [stats]);

  const totalMonthsCount = useMemo(() => {
    return stats?.months ? stats.months.length : 0;
  }, [stats]);

  const overallWinRate = useMemo(() => {
    if (totalMonthsCount > 0) {
      return Math.round((allWinningMonths / totalMonthsCount) * 100);
    }
    return Math.round(Number(stats?.winRate ?? 54));
  }, [allWinningMonths, totalMonthsCount, stats?.winRate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
      {/* ───────── 1. توزيع المحافظ + الشراكة المدمجة (1/3) ───────── */}
      <div className="lg:col-span-1 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
            <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span>توزيع المحافظ</span>
          </span>
          <span className="text-[10px] font-black text-slate-400">{portRows.length} محافظ نشطة</span>
        </div>

        {/* Stacked Portfolio Bar */}
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5" dir="ltr">
          {portRows.map(r => (
            <div
              key={r.portfolio.id}
              style={{ width: `${Math.max(2, r.share)}%`, background: r.portfolio.color }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`${r.portfolio.name}: ${r.share.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Portfolio Compact Rows with Embedded Cash Ammo Tag */}
        <div className="space-y-1.5">
          {portRows.map((r, idx) => {
            const pNav = r.stats.nav * factor;
            const pProf = r.stats.profit * factor;
            const pCashInfo = cashAmmo.byPortfolio.find(c => c.portfolioId === r.portfolio.id);
            const pCash = pCashInfo?.cashAmount ?? 0;
            const pCashPct = pCashInfo?.cashPct ?? 0;

            return (
              <button
                key={r.portfolio.id}
                onClick={() => onFocusPortfolio?.(r.portfolio.id)}
                className="w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-right"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.portfolio.color }} />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{r.portfolio.name}</span>
                  {idx === 0 && portRows.length > 1 && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span dir="ltr" className="text-[10px] font-black text-slate-400">{r.share.toFixed(0)}%</span>
                  {pCash > 0 && (
                    <span dir="ltr" className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0" title="كاش متاح داخل هذه المحفظة">
                      💵 {fmtCompact(pCash)} ({pCashPct.toFixed(0)}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span dir="ltr" className={cx('text-[10px] font-black px-1.5 py-0.5 rounded-md', pProf >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                    {fmtSigned(pProf)}
                  </span>
                  <b dir="ltr" className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                    {fmt(pNav)}
                  </b>
                </div>
              </button>
            );
          })}
        </div>

        {/* ───────── رادار الذخيرة الهجومية (Tactical Cash Ammo Radar) ───────── */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/[0.08] via-cyan-500/[0.04] to-indigo-500/[0.06] border border-sky-500/25 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-sky-600 dark:text-sky-400">
              <Banknote className="w-3.5 h-3.5" />
              <span>الذخيرة الهجومية (الكاش المتاح)</span>
            </span>
            <span className={cx('text-[9.5px] font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5', cashAmmo.postureColor)}>
              {cashAmmo.postureLabel}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div dir="ltr" className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
              {fmt(cashAmmo.totalCash)} <span className="text-[10px] font-bold text-slate-400">ج.م</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              نسبة السيولة: <b dir="ltr" className="text-sky-500 font-black">{cashAmmo.cashPct.toFixed(1)}%</b> من المحفظة
            </div>
          </div>

          {/* Ammo Readiness Gauge Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden flex" dir="ltr">
              <div
                className={cx(
                  'h-full rounded-full transition-all duration-700',
                  cashAmmo.cashPct < 5
                    ? 'bg-rose-500'
                    : cashAmmo.cashPct < 15
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                )}
                style={{ width: `${Math.min(100, Math.max(3, (cashAmmo.cashPct / 30) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
              <span>
                {cashAmmo.totalCash === 0
                  ? '💡 سجّل الكاش المتاح داخل كل محفظة لتفعيل رادار القنص'
                  : cashAmmo.targetCash15Amt > 0
                  ? `للوصول لـ 15% ذخيرة مثالية: +${fmtCompact(cashAmmo.targetCash15Amt)} ج.م`
                  : '✓ تمتلك سيولة هجومية ممتازة لاقتناص الفرص'}
              </span>
              {onOpenSnap && (
                <button
                  type="button"
                  onClick={onOpenSnap}
                  className="text-sky-600 dark:text-sky-400 font-black hover:underline shrink-0"
                >
                  تحديث الكاش ◂
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact Partner Split Footer (Embedded without taking extra space) */}
        {settings.partner.enabled && (
          <div className="rounded-2xl bg-purple-500/[0.05] border border-purple-500/20 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Users className="w-3 h-3" />
                <span>ميزان الشراكة</span>
              </span>
              <span dir="ltr" className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                تغطية {ownership.coveragePct.toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-1.5 border border-purple-500/10">
                <div className="text-[9px] font-bold text-slate-400">حصتي الخالصة ({ownership.mySharePct.toFixed(0)}%)</div>
                <div dir="ltr" className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {fmt(ownership.myNav)} ج.م
                </div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/60 rounded-xl p-1.5 border border-purple-500/10">
                <div className="text-[9px] font-bold text-slate-400">{settings.partner.name} ({ownership.partnerSharePct.toFixed(0)}%)</div>
                <div dir="ltr" className="text-xs font-black text-purple-600 dark:text-purple-400 tabular-nums">
                  {fmt(ownership.partnerCap)} ج.م
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────── 2. محرك الأداء والتوقعات المستقبلية (2/3) ───────── */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-4">
        {/* Top Header: Title & Horizon Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 dark:text-white">محرك الأداء والتوقعات المستقبلية</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  تفاعلي حي
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">
                محاكاة تراكم الثروة والعوائد وفق سيناريوهات النمو ومعدل الأداء الفعلي
              </p>
            </div>
          </div>

          {/* Time Horizon Segmented Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-black">
            {[
              { id: '6M', label: '6 شهور' },
              { id: '1Y', label: 'سنة' },
              { id: '2Y', label: 'سنتين' },
              { id: '3Y', label: '3 سنوات' },
            ].map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHorizon(h.id as any)}
                className={cx(
                  'rounded-lg px-2.5 py-1 transition-all',
                  horizon === h.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                )}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Core Grid: Realized Performance Run-Rate VS Future Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Column A: Realized Velocity (الأداء الفعلي المسجل) */}
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 p-3.5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>وتيرة الأداء الحقيقية (الواقعية)</span>
              </span>
              <span dir="ltr" className="text-[10px] font-black text-indigo-500">
                {stats?.days ?? 365} يوماً نشاطاً
              </span>
            </div>

            {/* Metric 1: Monthly Realized Run-rate */}
            <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2.5 border border-slate-200/50 dark:border-white/5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>متوسط الربح الشهري المحقق</span>
                <span dir="ltr" className={cx('font-black text-[10px]', (stats?.avgMonth ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                  {fmtPct(stats?.avgMonth ?? 0, 2)} شهرياً
                </span>
              </div>
              <div dir="ltr" className={cx('text-lg sm:text-xl font-black tabular-nums text-right mt-0.5', avgMonthlyGainEgp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                {fmtSigned(avgMonthlyGainEgp)} <span className="text-[11px] font-bold text-slate-400">ج.م/شهر</span>
              </div>
            </div>

            {/* Metric 2: Realized CAGR & Doubling Speed */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2 border border-slate-200/50 dark:border-white/5">
                <div className="text-[10px] font-bold text-slate-400 truncate">النمو السنوي المركب (CAGR)</div>
                <div dir="ltr" className="text-base font-black tabular-nums text-slate-900 dark:text-white mt-0.5">
                  +{effectiveCagr.toFixed(1)}%
                </div>
                <div className="text-[9px] font-bold text-slate-400">الوتيرة الفعلية</div>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-800/80 p-2 border border-slate-200/50 dark:border-white/5">
                <div className="text-[10px] font-bold text-slate-400 truncate">مضاعفة رأس المال</div>
                <div dir="ltr" className="text-base font-black tabular-nums text-amber-500 mt-0.5">
                  ~{yearsToDouble.toFixed(1)} سنة
                </div>
                <div className="text-[9px] font-bold text-slate-400">بحساب وتيرة الـ 72</div>
              </div>
            </div>

            {/* Consistency & Year Distinction Block (Rounded Values & 12M Track) */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>اتساق الأداء العام:</span>
                  <b dir="ltr" className="font-black text-emerald-600 dark:text-emerald-400">
                    {overallWinRate}%
                  </b>
                  <span className="text-[10px] text-slate-400">({allWinningMonths} من {totalMonthsCount} شهر)</span>
                </span>

                {yearMonths.length > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    حصاد {currentYear}: <b dir="ltr">{yearWinningMonths}/{yearMonths.length}</b> رابح ({yearWinRate}%)
                  </span>
                )}
              </div>

              {/* Visual Strip of Year Months with Tooltips */}
              {yearMonths.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 w-full" dir="ltr">
                    {yearMonths.map(m => {
                      const win = m.gain >= 0;
                      const monthIdx = Number(m.key.slice(5, 7)) - 1;
                      const mName = MONTHS_EN[monthIdx] || m.key;
                      return (
                        <div
                          key={m.key}
                          className={cx(
                            'flex-1 h-2 rounded-full transition-all duration-300 relative group cursor-pointer hover:scale-y-125',
                            win ? 'bg-emerald-500' : 'bg-rose-500/80'
                          )}
                          title={`${mName} ${currentYear}: ${win ? '+' : ''}${fmtPct(m.pct)} (${fmtSigned(m.gain)} ج.م)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                    <span>يناير {currentYear}</span>
                    <span className="text-emerald-500">🟢 رابح ({yearWinningMonths})</span>
                    <span className="text-rose-400">🔴 تصحيح ({yearMonths.length - yearWinningMonths})</span>
                    <span>نوفمبر {currentYear}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column B: Interactive Target Simulator (محاكي القيمة المستقبلية التفاعلي) */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] via-teal-500/[0.02] to-cyan-500/[0.05] border border-emerald-500/25 p-3.5 flex flex-col justify-between gap-3">
            {/* Top Selector: Presets & Custom Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-black">
                  <Target className="w-3.5 h-3.5 text-emerald-500" />
                  <span>العائد السنوي المتوقع للسيناريو:</span>
                </span>
                <span dir="ltr" className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {customRate}% سنوياً
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 mb-2">
                {[
                  { label: 'تحفظي', rate: 15 },
                  { label: 'الوتيرة الحالية', rate: Math.round(effectiveCagr > 0 ? effectiveCagr : 22) },
                  { label: 'متفائل', rate: 32 },
                  { label: 'زخم قوي', rate: 45 },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setCustomRate(p.rate)}
                    className={cx(
                      'flex-1 py-1 px-1 rounded-lg text-[10px] font-black transition-all truncate text-center',
                      customRate === p.rate
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10'
                    )}
                  >
                    {p.label} ({p.rate}%)
                  </button>
                ))}
              </div>

              {/* Slider Input */}
              <div className="px-1">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={customRate}
                  onChange={e => setCustomRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Glowing Projection Results Showcase Card */}
            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-500/30 p-3 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>القيمة السوقية المتوقعة بعد ({horizonLabel})</span>
                <span dir="ltr" className="text-emerald-500 font-black">
                  +{projectedGainPct.toFixed(1)}% نمو
                </span>
              </div>

              <div dir="ltr" className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white mt-0.5 text-right">
                {fmt(futureNav)} <span className="text-xs font-bold text-slate-400">ج.م</span>
              </div>

              {/* Secondary Gain Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-bold">
                <div>
                  <span className="text-slate-400 block">صافي الأرباح المتوقعة:</span>
                  <b dir="ltr" className="text-emerald-500 font-black tabular-nums text-xs">
                    +{fmt(projectedGain)} ج.م
                  </b>
                </div>
                <div>
                  <span className="text-slate-400 block">التدفق الشهري المتوقع:</span>
                  <b dir="ltr" className="text-teal-600 dark:text-teal-400 font-black tabular-nums text-xs">
                    +{fmt(projectedMonthlyGain)} ج.م/شهر
                  </b>
                </div>
              </div>

              {/* Motivating Partner Share Insight if Partner Enabled */}
              {settings.partner.enabled && (
                <div className="mt-2 pt-1.5 border-t border-purple-500/15 text-[9.5px] font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between">
                  <span>حصتك الخالصة المتوقعة:</span>
                  <b dir="ltr" className="font-black text-purple-600 dark:text-purple-300">
                    {fmt(projectedOwnership.myFutureNav)} ج.م (ترتفع لـ {projectedOwnership.myFutureSharePct.toFixed(0)}%)
                  </b>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KpiGrid({ stats, pts }: { stats: Stats; pts?: Point[] }) {
  const s = stats;

  // 1. الحساب الدقيق للقمة التاريخية الحقيقية والهبوط اللحظي الحالي
  const peakPt = useMemo(() => (pts && pts.length ? pts.reduce((max, p) => (p.nav > max.nav ? p : max), pts[0]) : null), [pts]);
  const peakNav = useMemo(() => {
    if (peakPt && peakPt.nav > 0) return peakPt.nav;
    if (s.maxDD < -0.5 && s.nav > 0) return s.nav / (1 + s.maxDD / 100);
    return s.nav;
  }, [peakPt, s.maxDD, s.nav]);

  const currentNav = s.nav;
  const currentDdAmt = Math.max(0, peakNav - currentNav);
  const currentDdPct = peakNav > 0 ? ((currentNav - peakNav) / peakNav) * 100 : 0;
  const recoveryAmt = currentDdAmt;
  const recoveryPct = currentNav > 0 ? (currentDdAmt / currentNav) * 100 : 0;
  const absCurrentDD = Math.abs(currentDdPct);
  const absMaxDD = Math.abs(s.maxDD);

  // حالة المخاطر اللحظية الدقيقة
  const ddStatus = absCurrentDD < 1
    ? { text: 'عند القمة التاريخية 🏆', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    : absCurrentDD <= 10
    ? { text: 'مخاطر منخفضة', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    : absCurrentDD <= 20
    ? { text: 'تصحيح معتاد', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    : { text: 'تراجع حاد', color: 'text-rose-500', bg: 'bg-rose-500/10' };

  // وسادة الأمان لرأس المال (Capital Cushion فوق الإيداعات)
  const cushionPct = s.netDeposits > 0 ? (s.profit / s.netDeposits) * 100 : 0;

  // كفاءة العائد مقابل التذبذب
  const riskEfficiency = useMemo(() => {
    if (!s.vol || s.vol <= 0 || s.avgMonth === null) return null;
    return s.avgMonth / s.vol;
  }, [s.vol, s.avgMonth]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Risk & Capital Defense Cockpit */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-900/90 p-5 shadow-sm flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">حماية رأس المال وإدارة المخاطر</h3>
          </div>
          <span className={cx('text-[10px] font-black px-2.5 py-1 rounded-full', ddStatus.bg, ddStatus.color)}>
            {ddStatus.text}
          </span>
        </div>

        {/* Drawdown & Recovery Dual Gauge */}
        <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الهبوط اللحظي من القمة</span>
              <div dir="ltr" className="text-xl font-black text-rose-500 tabular-nums">
                {currentDdPct === 0 ? '0.0%' : `${currentDdPct.toFixed(1)}%`}
                {currentDdAmt > 0 && (
                  <span className="text-xs font-bold text-slate-400 mr-1.5">
                    ({fmtSigned(-currentDdAmt)} ج.م)
                  </span>
                )}
              </div>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400">أقصى قاع مسجل</span>
              <div dir="ltr" className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">
                {s.maxDD === 0 ? '0.0%' : `${s.maxDD.toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Visual Track */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden flex relative" dir="ltr">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(3, (absCurrentDD / Math.max(absMaxDD, 25)) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400" dir="ltr">
              <span>0% (القمة 🏆)</span>
              <span>الآن ({currentDdPct.toFixed(1)}%)</span>
              <span>القاع ({s.maxDD.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Recovery Target */}
          {currentDdAmt > 0 ? (
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>مستهدف استعادة القمة:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <b dir="ltr" className="font-black text-orange-500">
                  +{fmt(recoveryAmt)} ج.م (+{recoveryPct.toFixed(1)}%)
                </b>
                <span className="text-[10px] text-slate-400">
                  (لـ {fmtCompact(peakNav)})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
              <ShieldCheck className="w-4 h-4" />
              <span>المحفظة تتداول حالياً عند أعلى قمة تاريخية مسجلة</span>
            </div>
          )}
        </div>

        {/* 3 Professional Risk Metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. وسادة الأمان لرأس المال (Capital Cushion) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-2.5 text-center flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 truncate">وسادة الأمان للرأسمال</div>
              <div dir="ltr" className={cx('text-sm sm:text-base font-black tabular-nums mt-0.5', s.profit >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                {s.profit >= 0 ? `+${fmtCompact(s.profit)}` : fmtCompact(s.profit)}
              </div>
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-1">
              {s.profit >= 0 ? `+${cushionPct.toFixed(1)}% فوق التكلفة` : `${cushionPct.toFixed(1)}% من التكلفة`}
            </div>
          </div>

          {/* 2. عامل الربحية (Profit Factor) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-2.5 text-center flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 truncate">عامل الربحية (PF)</div>
              <div dir="ltr" className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                {s.profitFactor === null ? '—' : s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-1">
              {s.profitFactor === null ? '—' : s.profitFactor >= 1.5 ? 'أرباح تفوق الخسائر' : s.profitFactor >= 1 ? 'متوازن' : 'تحت الضغط'}
            </div>
          </div>

          {/* 3. التذبذب الشهري وكفاءة العائد */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-2.5 text-center flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 truncate">التذبذب الشهري</div>
              <div dir="ltr" className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                {s.vol === null ? '—' : `±${s.vol.toFixed(1)}%`}
              </div>
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-1">
              {riskEfficiency !== null ? `كفاءة ${riskEfficiency.toFixed(1)}x` : s.vol && s.vol <= 5 ? 'هادئ' : 'نشط'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Rhythm & Consistency Cockpit */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-900/90 p-5 shadow-sm flex flex-col justify-between gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">نبض الأداء الشهري</h3>
          </div>

          {s.streak !== 0 && (
            <span className={cx('text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1', s.streak > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
              <Flame className="w-3 h-3" />
              {s.streak > 0 ? `${s.streak} شهور رابحة` : `${Math.abs(s.streak)} شهور تصحيح`}
            </span>
          )}
        </div>

        {/* Win Rate & Monthly Summary */}
        <div className="flex items-center justify-between gap-4 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl px-4 py-3 border border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <Ring value={s.winRate ?? 0} color={s.winRate && s.winRate >= 50 ? '#10b981' : '#f43f5e'} size={46}>
              {s.winRate === null ? '—' : `${s.winRate.toFixed(0)}%`}
            </Ring>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">الشهور الرابحة</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                {s.months.filter(m => m.gain >= 0).length} من {s.months.length} شهر
              </div>
            </div>
          </div>

          <div className="text-left border-r border-slate-200 dark:border-slate-700 pr-4">
            <div className="text-[10px] font-bold text-slate-400">متوسط الشهر</div>
            <div dir="ltr" className={cx('text-lg font-black tabular-nums', s.avgMonth !== null && tone(s.avgMonth))}>
              {s.avgMonth === null ? '—' : fmtPct(s.avgMonth)}
            </div>
          </div>
        </div>

        {/* Monthly Heatmap Compact Grid (No Cramped Scrollbar) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {s.months.length === 0 ? (
            <p className="col-span-3 text-center text-xs font-bold text-slate-400 py-3">لا توجد أشهر مكتملة بعد</p>
          ) : (
            s.months.slice(-9).map(m => {
              const isGain = m.gain >= 0;
              return (
                <div
                  key={m.key}
                  className={cx(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all',
                    isGain
                      ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/25 bg-rose-500/[0.06] text-rose-600 dark:text-rose-400'
                  )}
                >
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">{monthLabel(m.key)}</span>
                  <div className="text-left shrink-0">
                    <span dir="ltr" className="font-black tabular-nums block text-[10px] leading-tight">{fmtPct(m.pct, 1)}</span>
                    <span dir="ltr" className="text-[9px] font-bold opacity-80 block leading-tight">{fmtCompact(m.gain)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Best vs Worst Comparison */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-slate-400 block">أفضل شهر</span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate block">
                {s.best ? `${monthLabel(s.best.key)} (${fmtPct(s.best.pct, 1)})` : '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-slate-400 block">أضعف شهر</span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate block">
                {s.worst ? `${monthLabel(s.worst.key)} (${fmtPct(s.worst.pct, 1)})` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
