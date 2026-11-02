import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ComposedChart } from 'recharts';
import { Activity, Flame, ShieldAlert, TrendingDown, TrendingUp, Trophy, Calendar, Zap, Compass, Crown, Banknote, Users, Layers, ChevronUp, RefreshCw, Landmark } from 'lucide-react';
import { Card, ChartTip, CountUp, Empty, Segmented, cx, tone } from './ui';
import { useVault } from './VaultContext';
import type { Point, Stats, Period, PeriodRet, BenchmarksState } from './calc';
import {
  PERIODS,
  windowSeries,
  monthlyReturns,
  allocation,
  comparePortfolios,
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

export function Hero({ pts, stats, scopeLabel, lensLabel }: { pts: Point[]; stats: Stats; scopeLabel: string; lensLabel: string }) {
  const { cashflows } = useVault();
  const [peakOpen, setPeakOpen] = useState(false);
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
              {/* Top Header Bar: Right = Scope Badges | Left = Pure Graphical Trophy + Giant Peak Number Only */}
              <div className="flex items-start justify-between gap-2">
                {/* Right: Scope & Date Badges */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black pt-0.5">
                  <span className="rounded-full bg-white/10 px-2.5 sm:px-3 py-1 backdrop-blur">{scopeLabel}</span>
                  <span className="rounded-full bg-white/10 px-2.5 sm:px-3 py-1 backdrop-blur">{lensLabel}</span>
                  {last && <span className="text-slate-400 font-bold">آخر تحديث {fmtDate(last.date)}</span>}
                </div>

                {/* Left: Pure Trophy Graphic + Big Peak Number Only (Zero Text/Labels, Click to Expand) */}
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
                      {/* Trophy Graphic with Radial Progress Ring */}
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

                      {/* ONLY the Peak Number in Larger, Bold Typography */}
                      <span
                        dir="ltr"
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

                    {/* Bottom Sleek Progress Fill Line */}
                    <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden" dir="ltr">
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
              </div>

              {/* Main Row: Right = Giant Market Value (with Trophy Badge when Peak Broken!) | Left = Expanded Card */}
              <div className="mt-3 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-400">القيمة السوقية الحالية</div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-3">
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

                    {/* When Current Market Value is at/above Peak -> Trophy Victory Emblem directly on Current NAV! */}
                    {atPeak && (
                      <span
                        title="القيمة السوقية الحالية في القمة التاريخية!"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-400/40 ring-2 ring-amber-300/40 animate-pulse"
                      >
                        <Trophy className="w-4 h-4" />
                      </span>
                    )}

                    <span className={cx('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black', up ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
                      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span dir="ltr">{fmtPct(stats.retPct)}</span>
                    </span>
                  </div>
                </div>

                {/* Expanded Detailed Card (Only visible when clicked) */}
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
                          <b dir="ltr" className="text-white tabular-nums font-black text-sm">{fmt(peakPt.nav)}</b>
                        </span>
                        <div className="flex items-center gap-1">
                          <span dir="ltr" className={cx(
                            'rounded-full px-2 py-0.5 text-[10px] font-black',
                            toPeak > 0 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                          )}>
                            {toPeak > 0 ? `-${fmtCompact(toPeak)} (${diffPctFromPeak.toFixed(1)}%) · ${peakPct.toFixed(0)}%` : '100% 🏆'}
                          </span>
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>

                      {/* Visual Progress Bar to Peak */}
                      <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden" dir="ltr">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-300 transition-all duration-700"
                          style={{ width: `${peakPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 2 Compact Mini-Pills inside the Expanded Widget */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                          <Banknote className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                          <span>جني نقدي</span>
                        </span>
                        <b dir="ltr" className="text-xs font-black tabular-nums text-emerald-300">+{fmtCompact(harvestedCash)}</b>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>شهرياً</span>
                        </span>
                        <b dir="ltr" className={cx('text-xs font-black tabular-nums', (monthlyGainRate ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                          {monthlyGainRate !== null ? fmtCompact(monthlyGainRate) : '—'}
                        </b>
                      </div>
                    </div>
                  </div>
                )}
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
  const [mode, setMode] = useState<Mode>('capital');
  const [period, setPeriod] = useState<Period>('3M');
  const [unit, setUnit] = useState<'egp' | 'pct'>('egp');
  const [bench, setBench] = useState<BenchmarksState>(() => loadCachedBenchmarks());
  const [syncingBench, setSyncingBench] = useState(false);
  const [bankRate, setBankRate] = useState<number>(() => {
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return !isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27;
  });
  const [customBankStr, setCustomBankStr] = useState<string>(() => {
    const saved = Number(localStorage.getItem('egx_vault_bank_rate'));
    return String(!isNaN(saved) && saved > 0 && saved <= 100 ? saved : 27);
  });
  const [showLines, setShowLines] = useState<{ bank: boolean; egx30: boolean; egx70: boolean }>({
    bank: true,
    egx30: true,
    egx70: true,
  });

  const applyBankRate = (r: number) => {
    const clamped = Math.max(0, Math.min(100, r));
    setBankRate(clamped);
    setCustomBankStr(String(clamped));
    try {
      localStorage.setItem('egx_vault_bank_rate', String(clamped));
    } catch {
      // ignore
    }
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
            {mode === 'capital' && last && (
              <>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">المركز المالي ومصادر النمو</div>
                  <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                    <span dir="ltr" className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                      {fmt(last.nav)} ج.م
                    </span>
                    <span dir="ltr" className={cx('rounded-lg px-2 py-0.5 text-xs font-black', last.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                      {fmtSigned(last.profit)} ج.م ({fmtPct((last.index - 1) * 100, 1)})
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                    صافي الإيداعات: <b dir="ltr" className="text-indigo-500">{fmt(last.deposits)} ج.م</b>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />القيمة السوقية</span>
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-indigo-400" />صافي الإيداعات</span>
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-emerald-400" />صافي العوائد</span>
                </div>
              </>
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
                  <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} domain={['auto', 'auto']} />
                  <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} content={<ChartTip labelFmt={fmtDate} rows={p => [
                    { name: 'القيمة السوقية', value: `${fmt(+p.nav)} ج.م`, color: accent },
                    { name: 'صافي الإيداعات', value: `${fmt(+p.deposits)} ج.م (${+p.nav > 0 ? ((+p.deposits / +p.nav) * 100).toFixed(0) : 100}%)`, color: '#818cf8' },
                    { name: 'صافي العوائد التراكمية', value: `${fmtSigned(+p.profit)} ج.م (${fmtPct((+p.index - 1) * 100, 1)})`, color: +p.profit >= 0 ? '#34d399' : '#fb7185' },
                  ]} />} />
                  <Area type="stepAfter" dataKey="deposits" stroke="#818cf8" strokeWidth={2} fill="url(#gDep)" dot={false} />
                  <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#gProfCap)" dot={false} />
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
                      stroke="#fbbf24"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
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

/* ───────── Portfolio Distribution, Asset Mix & Ownership Snapshot (Zero Redundancy) ───────── */
export function WealthGrowthDecomposition({
  scopeIds,
  factor = 1,
  onFocusPortfolio,
}: {
  stats?: Stats;
  lensLabel?: string;
  scopeIds?: string[];
  factor?: number;
  onFocusPortfolio?: (pid: string) => void;
}) {
  const { settings, snapshots, cashflows } = useVault();
  const activePorts = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);
  const effScopeIds = useMemo(() => (scopeIds && scopeIds.length ? scopeIds : activePorts.map(p => p.id)), [scopeIds, activePorts]);

  // 1. ترتيب المحافظ وحصتها في القيمة السوقية والعوائد
  const portRows = useMemo(
    () => comparePortfolios(snapshots, cashflows, activePorts).sort((a, b) => b.stats.nav - a.stats.nav),
    [snapshots, cashflows, activePorts]
  );

  // 2. توزيع فئات الأصول (أسهم / كلاودز / صناديق / ذهب / كاش)
  const assetSlices = useMemo(
    () => allocation(snapshots, cashflows, effScopeIds).map(s => ({ ...s, value: s.value * factor })),
    [snapshots, cashflows, effScopeIds, factor]
  );
  const assetTotal = useMemo(() => assetSlices.reduce((sum, s) => sum + s.value, 0), [assetSlices]);

  // 3. معادلة الملكية الخالصة (حصتي مقابل الشريك لولو)
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
      {/* 1. توزيع المحافظ (ثاندر · مباشر · هيرميس) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
            <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span>توزيع المحافظ</span>
          </span>
          <span className="text-[10px] font-black text-slate-400">{portRows.length} محافظ</span>
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

        {/* Portfolio Compact Rows */}
        <div className="space-y-1.5">
          {portRows.map((r, idx) => {
            const pNav = r.stats.nav * factor;
            const pProf = r.stats.profit * factor;
            return (
              <button
                key={r.portfolio.id}
                onClick={() => onFocusPortfolio?.(r.portfolio.id)}
                className="w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-right"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.portfolio.color }} />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{r.portfolio.name}</span>
                  {idx === 0 && portRows.length > 1 && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span dir="ltr" className="text-[10px] font-black text-slate-400">{r.share.toFixed(0)}%</span>
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
      </div>

      {/* 2. هيكل الأصول (أسهم · كلاودز · صناديق · كاش) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
            <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span>توزيع الأصول</span>
          </span>
          {assetSlices[0] && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              الأكبر: {assetSlices[0].label} {assetTotal > 0 ? `${((assetSlices[0].value / assetTotal) * 100).toFixed(0)}%` : ''}
            </span>
          )}
        </div>

        {/* Stacked Asset Allocation Bar */}
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5" dir="ltr">
          {assetSlices.map(s => {
            const pct = assetTotal > 0 ? (s.value / assetTotal) * 100 : 0;
            return (
              <div
                key={s.key}
                style={{ width: `${Math.max(2, pct)}%`, background: s.color }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                title={`${s.label}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Asset Pills Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {assetSlices.slice(0, 4).map(s => {
            const pct = assetTotal > 0 ? (s.value / assetTotal) * 100 : 0;
            return (
              <div key={s.key} className="flex items-center justify-between rounded-xl px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <i className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                </div>
                <div className="text-left shrink-0">
                  <b dir="ltr" className="text-[11px] font-black tabular-nums text-slate-900 dark:text-white block">
                    {fmtCompact(s.value)}
                  </b>
                  <span dir="ltr" className="text-[9px] font-black text-slate-400 block">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ميزان الملكية الخالصة (حصتي مقابل الشريك) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
            <span className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span>هيكل الملكية</span>
          </span>
          <span dir="ltr" className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            تغطية {ownership.coveragePct.toFixed(0)}%
          </span>
        </div>

        {/* Dual Ownership Bar */}
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5" dir="ltr">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
            style={{ width: `${ownership.mySharePct}%` }}
          />
          {settings.partner.enabled && (
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-r-full transition-all duration-500"
              style={{ width: `${ownership.partnerSharePct}%` }}
            />
          )}
        </div>

        {/* 2 Ownership Boxes */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 px-2.5 py-2">
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              <span>حصتي الخالصة</span>
              <span dir="ltr">{ownership.mySharePct.toFixed(0)}%</span>
            </div>
            <div dir="ltr" className="text-sm font-black tabular-nums text-slate-900 dark:text-white text-right mt-0.5">
              {fmt(ownership.myNav)}
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-0.5">
              <span>إيداعي {fmtCompact(ownership.myDep)}</span>
              <b dir="ltr" className={ownership.myProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {fmtPct(ownership.myRetPct, 0)}
              </b>
            </div>
          </div>

          <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/20 px-2.5 py-2">
            <div className="flex items-center justify-between text-[10px] font-black text-purple-600 dark:text-purple-400">
              <span>{settings.partner.name}</span>
              <span dir="ltr">{ownership.partnerSharePct.toFixed(0)}%</span>
            </div>
            <div dir="ltr" className="text-sm font-black tabular-nums text-slate-900 dark:text-white text-right mt-0.5">
              {fmt(ownership.partnerCap)}
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-0.5">
              <span>رأس مال ثابت</span>
              <b dir="ltr" className="text-emerald-500">آمن 100%</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KpiGrid({ stats }: { stats: Stats }) {
  const s = stats;
  const absDD = Math.abs(s.maxDD);
  const ddStatus = absDD < 10 ? { text: 'مخاطر منخفضة', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    : absDD <= 20 ? { text: 'تصحيح معتاد', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    : { text: 'تراجع حاد', color: 'text-rose-500', bg: 'bg-rose-500/10' };

  // Calculate recovery to peak
  const hasDD = s.maxDD < -0.5 && s.nav > 0;
  const peakNav = hasDD ? s.nav / (1 + s.maxDD / 100) : s.nav;
  const recoveryAmt = Math.max(0, peakNav - s.nav);
  const recoveryPct = s.nav > 0 && hasDD ? ((peakNav / s.nav) - 1) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Risk & Capital Defense Cockpit */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-900/90 p-5 shadow-sm flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">حماية رأس المال والمخاطر</h3>
          </div>
          <span className={cx('text-[10px] font-black px-2.5 py-1 rounded-full', ddStatus.bg, ddStatus.color)}>
            {ddStatus.text}
          </span>
        </div>

        {/* Max Drawdown Progress Bar */}
        <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2.5 border border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">أقصى هبوط</span>
            <span dir="ltr" className="text-xl font-black text-rose-500 tabular-nums">
              {s.maxDD === 0 ? '0.0%' : `${s.maxDD.toFixed(1)}%`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-700"
              style={{ width: `${Math.min(100, (absDD / 30) * 100)}%` }}
            />
          </div>
          {hasDD && recoveryAmt > 0 && (
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 pt-0.5">
              <span className="flex items-center gap-1 text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                استعادة القمة
              </span>
              <b dir="ltr" className="font-black text-orange-500">+{fmt(recoveryAmt)} ج.م (+{recoveryPct.toFixed(1)}%)</b>
            </div>
          )}
        </div>

        {/* 3 Sub-Metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400">عامل الربحية</div>
            <div dir="ltr" className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
              {s.profitFactor === null ? '—' : s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-0.5">
              {s.profitFactor === null ? '—' : s.profitFactor >= 1.5 ? 'ممتاز' : s.profitFactor >= 1 ? 'متوازن' : 'تحت الضغط'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400">التذبذب الشهري</div>
            <div dir="ltr" className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
              {s.vol === null ? '—' : `±${s.vol.toFixed(1)}%`}
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-0.5">
              {s.vol === null ? '—' : s.vol <= 5 ? 'هادئ' : 'نشط'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-800/30 p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400">لكل 1000 ج.م</div>
            <div dir="ltr" className={cx('text-base font-black tabular-nums mt-0.5', tone(s.profit))}>
              {s.netDeposits > 0 ? fmtSigned((s.profit / s.netDeposits) * 1000) : '—'}
            </div>
            <div className="text-[9px] font-black text-slate-400 mt-0.5 truncate">
              {s.days} يوم
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
