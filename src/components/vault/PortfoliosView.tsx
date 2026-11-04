import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Crown, ArrowUpRight } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx, tone } from './ui';
import { useVault } from './VaultContext';
import type { Period } from './calc';
import { PERIODS, allocation, buildSeries, comparePortfolios, computeCashAmmo, fmt, fmtCompact, fmtPct, fmtSigned, fmtDate, raceData, shortDate, windowSeries } from './calc';

type ChartTab = 'race' | 'quality' | 'nav' | 'assets';

export function PortfoliosView({ factor, scopeIds, onFocus }: { factor: number; scopeIds: string[]; onFocus: (id: string) => void }) {
  const { settings, snapshots, cashflows } = useVault();
  const [period, setPeriod] = useState<Period>('All');
  const [chartTab, setChartTab] = useState<ChartTab>('race');
  const ports = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);

  const rows = useMemo(() => comparePortfolios(snapshots, cashflows, ports), [snapshots, cashflows, ports]);
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const [activePortId, setActivePortId] = useState<string>('');
  const activeR = ranked.find(r => r.portfolio.id === activePortId) ?? ranked[0];

  const cashAmmo = useMemo(() => computeCashAmmo(snapshots, cashflows, ports, scopeIds, factor), [snapshots, cashflows, ports, scopeIds, factor]);
  const alloc = useMemo(() => allocation(snapshots, cashflows, scopeIds).map(s => ({ ...s, value: s.value * factor })), [snapshots, cashflows, scopeIds, factor]);
  const allocTotal = alloc.reduce((a, s) => a + s.value, 0);

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
        const pInvested = pCashObj?.investedAmount ?? Math.round(s.nav * factor);

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

              {/* Assets & Cash Allocation */}
              <div className="md:col-span-3 space-y-2">
                <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">📈 مستثمر بالأسهم</div>
                    <div className="text-[10px] font-semibold text-slate-400">{(100 - pCashPct).toFixed(0)}% من المحفظة</div>
                  </div>
                  <b dir="ltr" className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{fmt(pInvested)}</b>
                </div>
                <div className="rounded-2xl bg-sky-500/[0.07] border border-sky-500/25 p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-sky-700 dark:text-sky-400">💵 كاش هجومي متاح</div>
                    <div className="text-[10px] font-semibold text-slate-400">{pCashPct.toFixed(0)}% ذخيرة سيولة</div>
                  </div>
                  <b dir="ltr" className="text-sm font-black text-sky-600 dark:text-sky-400 tabular-nums">{fmt(pCash)}</b>
                </div>
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

      {/* Unified wide chart card — switch between views */}
      <Card
        title={chartTab === 'race' ? 'سباق النمو (بغض النظر عن حجم المال)' : chartTab === 'quality' ? 'جودة الإدارة' : chartTab === 'nav' ? 'تطور القيمة السوقية بالمحافظ' : 'توزيع الأصول'}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {chartTab === 'race' && <Segmented size="sm" value={period} onChange={setPeriod} options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))} />}
            <Segmented
              size="sm"
              value={chartTab}
              onChange={setChartTab}
              options={[
                { v: 'race' as ChartTab, label: 'سباق النمو' },
                { v: 'quality' as ChartTab, label: 'الجودة' },
                { v: 'nav' as ChartTab, label: 'القيمة السوقية' },
                { v: 'assets' as ChartTab, label: 'الأصول' },
              ]}
            />
          </div>
        }
      >
        <div className="flex flex-wrap gap-4 mb-3 text-[11px] font-bold text-slate-500">
          {ports.map(p => <span key={p.id} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>)}
        </div>

        {chartTab === 'race' && (
          <div dir="ltr" className="h-80 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={race} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis orientation="right" tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.5} />
                <Tooltip content={<ChartTip labelFmt={fmtDate} rows={p => ports.filter(x => p[x.id] !== undefined).map(x => ({ name: x.name, value: fmtPct(+p[x.id]), color: x.color }))} />} />
                {ports.map(p => <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={2.5} dot={false} connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartTab === 'quality' && (
          <div dir="ltr" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                {ports.map(p => <Radar key={p.id} dataKey={p.id} name={p.name} stroke={p.color} fill={p.color} fillOpacity={0.18} strokeWidth={2} />)}
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
                {ports.map(p => <Area key={p.id} type="monotone" stackId="1" dataKey={p.id} stroke={p.color} fill={p.color} fillOpacity={0.35} strokeWidth={2} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartTab === 'assets' && (
          alloc.length === 0 ? <Empty text="لا توجد بيانات" /> : (
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
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><i className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                    <span className="flex items-center gap-3"><b dir="ltr" className="tabular-nums">{fmt(s.value)}</b><span className="w-12 text-left text-slate-400">{((s.value / allocTotal) * 100).toFixed(1)}%</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </Card>

      {/* Allocation per portfolio */}
      <Card title="تركيبة كل محفظة">
        <div className="space-y-4">
          {perPortfolioAlloc.map(({ p, slices }) => {
            const tot = slices.reduce((a, s) => a + s.value, 0);
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>
                  <span dir="ltr" className="text-slate-400 tabular-nums">{fmt(tot * factor)}</span>
                </div>
                <div className="flex h-5 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800" dir="ltr">
                  {slices.map(s => <div key={s.key} title={`${s.label} ${fmt(s.value)}`} style={{ width: `${(s.value / tot) * 100}%`, background: s.color }} className="h-full transition-all duration-700" />)}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                  {slices.map(s => <span key={s.key} className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.label} {((s.value / tot) * 100).toFixed(0)}%</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
