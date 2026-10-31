import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ComposedChart } from 'recharts';
import { Activity, Flame, Gauge, ShieldAlert, Sparkles, Target, TrendingDown, TrendingUp, Trophy, Wallet } from 'lucide-react';
import { Card, ChartTip, CountUp, Empty, Segmented, cx, tone } from './ui';
import type { Point, Stats, Period } from './calc';
import { PERIODS, windowSeries, fmt, fmtCompact, fmtPct, fmtSigned, fmtDate, shortDate, monthLabel } from './calc';

type Mode = 'capital' | 'profit' | 'twr' | 'dd';

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
  const last = pts[pts.length - 1];
  const spark = pts.slice(-60);
  const up = stats.profit >= 0;
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      {spark.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area type="monotone" dataKey="nav" stroke={up ? '#34d399' : '#fb7185'} strokeWidth={2} fill="url(#heroSpark)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
          <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">{scopeLabel}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">{lensLabel}</span>
          {last && <span className="text-slate-400 font-bold">آخر تحديث {fmtDate(last.date)}</span>}
        </div>
        <div className="mt-5 text-xs font-bold text-slate-400">القيمة السوقية الحالية</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span dir="ltr" className="text-4xl sm:text-6xl font-black tabular-nums tracking-tight">
            <CountUp value={stats.nav} format={n => fmt(n)} />
          </span>
          <span className="text-sm font-bold text-slate-400">ج.م</span>
          <span className={cx('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black', up ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span dir="ltr">{fmtPct(stats.retPct)}</span>
          </span>
        </div>
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

export function MainChart({ pts, accent = '#f97316' }: { pts: Point[]; accent?: string }) {
  const [mode, setMode] = useState<Mode>('capital');
  const [period, setPeriod] = useState<Period>('3M');
  const data = useMemo(() => windowSeries(pts, period), [pts, period]);
  const first = data[0];
  const last = data[data.length - 1];

  const header = last && (
    mode === 'capital' ? { label: 'القيمة السوقية', value: `${fmt(last.nav)} ج.م`, sub: `صافي الإيداعات ${fmt(last.deposits)}`, n: 0 }
    : mode === 'profit' ? { label: `عوائد الفترة`, value: `${fmtSigned(last.pProfit)} ج.م`, sub: `إجمالي منذ البداية ${fmtSigned(last.profit)}`, n: last.pProfit }
    : mode === 'twr' ? { label: 'نمو الفترة', value: fmtPct(last.pTwr), sub: `منذ البداية ${fmtPct((last.index - 1) * 100)}`, n: last.pTwr }
    : { label: 'أقصى هبوط بالفترة', value: fmtPct(Math.min(...data.map(d => d.pDd))), sub: `الحالي ${fmtPct(last.pDd)}`, n: -1 }
  );

  const key = mode === 'profit' ? 'pProfit' : mode === 'twr' ? 'pTwr' : 'pDd';
  const off = mode === 'profit' || mode === 'twr' ? splitOffset(data.map(d => d[key as 'pProfit'])) : 1;

  return (
    <Card
      title="تحليل الأداء"
      right={<Segmented size="sm" value={mode} onChange={setMode} options={[{ v: 'capital', label: 'رأس المال' }, { v: 'profit', label: 'العوائد' }, { v: 'twr', label: 'النمو %' }, { v: 'dd', label: 'الهبوط' }]} />}
    >
      {!data.length ? (
        <Empty icon={<Activity className="w-10 h-10" />} text="سجّل أول قيمة سوقية لتظهر الرسوم" />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400">{header!.label}</div>
              <div dir="ltr" className={cx('text-2xl font-black tabular-nums text-right', mode !== 'capital' && tone(header!.n))}>{header!.value}</div>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">{header!.sub}</div>
            </div>
            {mode === 'capital' && (
              <div className="flex gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />القيمة السوقية</span>
                <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-indigo-400" />صافي الإيداعات</span>
              </div>
            )}
          </div>
          <div dir="ltr" className="h-72 sm:h-80 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'capital' ? (
                <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNav" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={0.35} /><stop offset="100%" stopColor={accent} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} domain={['auto', 'auto']} />
                  <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} content={<ChartTip labelFmt={fmtDate} rows={p => [
                    { name: 'القيمة السوقية', value: fmt(+p.nav), color: accent },
                    { name: 'صافي الإيداعات', value: fmt(+p.deposits), color: '#818cf8' },
                    { name: 'العوائد', value: fmtSigned(+p.profit), color: +p.profit >= 0 ? '#34d399' : '#fb7185' },
                  ]} />} />
                  <Area type="stepAfter" dataKey="deposits" stroke="#818cf8" strokeWidth={2} fill="url(#gDep)" dot={false} />
                  <Area type="monotone" dataKey="nav" stroke={accent} strokeWidth={2.5} fill="url(#gNav)" dot={data.length < 25 ? { r: 3, fill: accent } : false} activeDot={{ r: 5 }} />
                </ComposedChart>
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
                  <YAxis orientation="right" tickFormatter={mode === 'profit' ? fmtCompact : (v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.5} />
                  <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} content={<ChartTip labelFmt={fmtDate} rows={p => mode === 'profit'
                    ? [{ name: 'عوائد الفترة', value: fmtSigned(+p.pProfit), color: '#34d399' }, { name: 'إجمالي العوائد', value: fmtSigned(+p.profit), color: '#818cf8' }]
                    : mode === 'twr' ? [{ name: 'نمو الفترة', value: fmtPct(+p.pTwr), color: '#34d399' }]
                    : [{ name: 'الهبوط', value: fmtPct(+p.pDd), color: '#fb7185' }]} />} />
                  <Area type="monotone" dataKey={key} stroke={mode === 'dd' ? '#fb7185' : 'url(#gSplitStroke)'} strokeWidth={2.5} fill="url(#gSplitFill)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center">
            <Segmented value={period} onChange={setPeriod} options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))} />
          </div>
          {first && last && first.date !== last.date && (
            <div className="mt-3 text-center text-[11px] font-bold text-slate-400">{fmtDate(first.date)} ← {fmtDate(last.date)}</div>
          )}
        </>
      )}
    </Card>
  );
}

export function KpiGrid({ stats }: { stats: Stats }) {
  const s = stats;
  const items = [
    { icon: <Target className="w-4 h-4" />, label: 'الشهور الرابحة', ring: s.winRate, ringColor: '#10b981', ringText: s.winRate === null ? '—' : `${s.winRate.toFixed(0)}%`, sub: `${s.months.filter(m => m.gain >= 0).length} من ${s.months.length} شهر` },
    { icon: <ShieldAlert className="w-4 h-4" />, label: 'أقصى هبوط', ring: Math.min(100, Math.abs(s.maxDD) * 4), ringColor: '#f43f5e', ringText: `${Math.abs(s.maxDD).toFixed(1)}%`, sub: 'من القمة السابقة' },
    { icon: <Gauge className="w-4 h-4" />, label: 'متوسط الشهر', value: s.avgMonth === null ? '—' : fmtPct(s.avgMonth), n: s.avgMonth ?? 0, sub: s.vol === null ? 'التذبذب —' : `التذبذب ±${s.vol.toFixed(1)}%` },
    { icon: <Flame className="w-4 h-4" />, label: 'السلسلة الحالية', value: s.streak === 0 ? '—' : `${Math.abs(s.streak)} ${s.streak > 0 ? 'شهور رابحة' : 'شهور خاسرة'}`, n: s.streak, sub: s.ratio === null ? 'نسبة العائد/التذبذب —' : `نسبة العائد/التذبذب ${s.ratio.toFixed(2)}` },
    { icon: <Trophy className="w-4 h-4" />, label: 'أفضل شهر', value: s.best ? fmtPct(s.best.pct) : '—', n: s.best?.pct ?? 0, sub: s.best ? monthLabel(s.best.key) : '' },
    { icon: <TrendingDown className="w-4 h-4" />, label: 'أسوأ شهر', value: s.worst ? fmtPct(s.worst.pct) : '—', n: s.worst?.pct ?? 0, sub: s.worst ? monthLabel(s.worst.key) : '' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'عامل الربحية', value: s.profitFactor === null ? '—' : s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2), n: s.profitFactor === null ? 0 : s.profitFactor >= 1 ? 1 : -1, sub: 'أرباح الشهور ÷ خسائرها' },
    { icon: <Wallet className="w-4 h-4" />, label: 'ربح لكل 1000 مودعة', value: s.netDeposits > 0 ? fmtSigned((s.profit / s.netDeposits) * 1000) : '—', n: s.profit, sub: `خلال ${s.days} يوم` },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(i => (
        <div key={i.label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">{i.icon}{i.label}</div>
            {'ring' in i
              ? <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">{i.sub}</div>
              : <>
                <div dir="ltr" className={cx('mt-1 text-lg font-black tabular-nums text-right truncate', tone(i.n as number))}>{i.value}</div>
                <div className="text-[10px] font-bold text-slate-400 truncate">{i.sub}</div>
              </>}
          </div>
          {'ring' in i && <Ring value={i.ring ?? 0} color={i.ringColor as string}>{i.ringText}</Ring>}
        </div>
      ))}
    </div>
  );
}

export function Insights({ stats }: { stats: Stats }) {
  const s = stats;
  const lines: { t: string; good?: boolean }[] = [];
  if (s.months.length) {
    const last = s.months[s.months.length - 1];
    lines.push({ t: `${monthLabel(last.key)}: ${fmtPct(last.pct)} (${fmtSigned(last.gain)} ج.م)`, good: last.gain >= 0 });
  }
  if (s.best && s.months.length > 1) lines.push({ t: `أقوى شهر ${monthLabel(s.best.key)} بنمو ${fmtPct(s.best.pct)}`, good: true });
  if (s.worst && s.months.length > 1 && s.worst.pct < 0) lines.push({ t: `أضعف شهر ${monthLabel(s.worst.key)} بتراجع ${fmtPct(s.worst.pct)}`, good: false });
  if (s.maxDD < -0.5) lines.push({ t: `أقصى هبوط من القمة ${s.maxDD.toFixed(1)}%`, good: false });
  if (s.annualized !== null) lines.push({ t: `بالمعدل الحالي العائد السنوي المركب ≈ ${fmtPct(s.annualized, 1)}`, good: s.annualized >= 0 });
  if (Math.abs(s.streak) >= 2) lines.push({ t: `${Math.abs(s.streak)} شهور ${s.streak > 0 ? 'رابحة' : 'خاسرة'} متتالية`, good: s.streak > 0 });
  if (!lines.length) return null;
  return (
    <Card title={<span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />قراءات سريعة</span>}>
      <ul className="space-y-2">
        {lines.map(l => (
          <li key={l.t} className="flex items-start gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <i className={cx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', l.good ? 'bg-emerald-500' : 'bg-rose-500')} />{l.t}
          </li>
        ))}
      </ul>
    </Card>
  );
}
