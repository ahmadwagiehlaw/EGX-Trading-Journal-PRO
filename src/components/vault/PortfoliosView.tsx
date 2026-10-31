import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Crown } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx, tone } from './ui';
import { useVault } from './VaultContext';
import type { Period } from './calc';
import { PERIODS, allocation, buildSeries, comparePortfolios, fmt, fmtCompact, fmtPct, fmtSigned, fmtDate, raceData, shortDate, windowSeries } from './calc';

export function PortfoliosView({ factor, scopeIds, onFocus }: { factor: number; scopeIds: string[]; onFocus: (id: string) => void }) {
  const { settings, snapshots, cashflows } = useVault();
  const [period, setPeriod] = useState<Period>('All');
  const ports = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);

  const rows = useMemo(() => comparePortfolios(snapshots, cashflows, ports), [snapshots, cashflows, ports]);
  const ranked = [...rows].sort((a, b) => b.score - a.score);
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
      {/* Portfolio cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ranked.map((r, i) => {
          const s = r.stats;
          const series = buildSeries(snapshots, cashflows, [r.portfolio.id]).slice(-40);
          return (
            <button key={r.portfolio.id} onClick={() => onFocus(r.portfolio.id)} className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 text-right transition hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: r.portfolio.color }} />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <i className="w-3 h-3 rounded-full" style={{ background: r.portfolio.color }} />
                  <span className="font-black text-slate-900 dark:text-white">{r.portfolio.name}</span>
                  {i === 0 && ranked.length > 1 && <Crown className="w-4 h-4 text-amber-400" />}
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white" style={{ background: r.portfolio.color }}>تقييم {r.score}</span>
              </div>
              <div dir="ltr" className="mt-3 text-2xl font-black tabular-nums text-right">{fmt(s.nav * factor)}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-black">
                <span dir="ltr" className={tone(s.profit)}>{fmtSigned(s.profit * factor)}</span>
                <span dir="ltr" className={tone(s.twrPct)}>{fmtPct(s.twrPct)}</span>
              </div>
              <div dir="ltr" className="mt-3 h-14 -mx-1">
                {series.length > 1 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs><linearGradient id={`sp${r.portfolio.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={r.portfolio.color} stopOpacity={0.4} /><stop offset="100%" stopColor={r.portfolio.color} stopOpacity={0} /></linearGradient></defs>
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Area dataKey="nav" type="monotone" stroke={r.portfolio.color} strokeWidth={2} fill={`url(#sp${r.portfolio.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1"><span>حصتها من الإجمالي</span><span>{r.share.toFixed(1)}%</span></div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.share}%`, background: r.portfolio.color }} /></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Race */}
      <Card title="سباق النمو (بغض النظر عن حجم المال)" right={<Segmented size="sm" value={period} onChange={setPeriod} options={PERIODS.map(p => ({ v: p, label: p === 'All' ? 'الكل' : p }))} />}>
        <div className="flex flex-wrap gap-4 mb-3 text-[11px] font-bold text-slate-500">
          {ports.map(p => <span key={p.id} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>)}
        </div>
        <div dir="ltr" className="h-72 -mx-2">
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <Card title="جودة الإدارة">
          <div dir="ltr" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                {ports.map(p => <Radar key={p.id} dataKey={p.id} name={p.name} stroke={p.color} fill={p.color} fillOpacity={0.18} strokeWidth={2} />)}
                <Tooltip content={<ChartTip rows={d => ports.map(x => ({ name: x.name, value: (+d[x.id]).toFixed(0), color: x.color }))} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut */}
        <Card title="توزيع الأصول">
          {alloc.length === 0 ? <Empty text="لا توجد بيانات" /> : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div dir="ltr" className="relative h-56 w-56 shrink-0">
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
              <ul className="w-full space-y-2">
                {alloc.map(s => (
                  <li key={s.key} className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><i className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                    <span className="flex items-center gap-3"><b dir="ltr" className="tabular-nums">{fmt(s.value)}</b><span className="w-12 text-left text-slate-400">{((s.value / allocTotal) * 100).toFixed(1)}%</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

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

      {/* Stacked NAV */}
      <Card title="تطور القيمة السوقية بالمحافظ">
        <div dir="ltr" className="h-64 -mx-2">
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
