import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx } from './ui';
import type { Point, PeriodRet } from './calc';
import { MONTHS_AR, MONTHS_EN, monthLabel, monthlyReturns, weeklyReturns, yearlyReturns, fmt, fmtPct, fmtSigned, fmtDate } from './calc';

type Mode = 'month' | 'week' | 'year';

const bg = (pct: number, max: number) => {
  const a = Math.min(0.5, 0.06 + (Math.abs(pct) / (max || 1)) * 0.44);
  return pct >= 0 ? `rgba(16,185,129,${a})` : `rgba(244,63,94,${a})`;
};

function Cell2({ label, r, max, sub }: { label: string; r?: PeriodRet; max: number; sub?: string }) {
  if (!r) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-3 min-h-[92px]">
        <div className="text-[11px] font-black text-slate-300 dark:text-slate-600">{label}</div>
      </div>
    );
  }
  const up = r.gain >= 0;
  return (
    <div className={cx('relative overflow-hidden rounded-2xl border p-3 min-h-[92px] transition hover:-translate-y-0.5 hover:shadow-lg', up ? 'border-emerald-500/50' : 'border-rose-500/50')} style={{ background: bg(r.pct, max) }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{label}</span>
        {sub && <span className="text-[9px] font-bold text-slate-400">{sub}</span>}
      </div>
      <div dir="ltr" className={cx('mt-2 text-lg font-black tabular-nums text-right', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{fmtPct(r.pct, 1)}</div>
      <div dir="ltr" className="text-[11px] font-black tabular-nums text-right text-slate-700 dark:text-slate-200">{fmtSigned(r.gain)}</div>
      {Math.abs(r.flow) > 0 && <div dir="ltr" className="text-[10px] font-bold text-right text-slate-400">{r.flow > 0 ? 'إيداع' : 'سحب'} {fmt(Math.abs(r.flow))}</div>}
    </div>
  );
}

export function CalendarView({ pts }: { pts: Point[] }) {
  const months = useMemo(() => monthlyReturns(pts), [pts]);
  const weeks = useMemo(() => weeklyReturns(pts), [pts]);
  const years = useMemo(() => yearlyReturns(months), [months]);
  const nowY = new Date().getFullYear();
  const [year, setYear] = useState(() => (months.length ? +months[months.length - 1].key.slice(0, 4) : nowY));
  const [mode, setMode] = useState<Mode>('month');

  if (!months.length) return <Card><Empty text="التقويم هيظهر بعد تسجيل قيم سوقية" /></Card>;

  const minY = +months[0].key.slice(0, 4);
  const maxY = +months[months.length - 1].key.slice(0, 4);
  const yMonths = months.filter(m => m.key.startsWith(String(year)));
  const maxAbs = Math.max(...months.map(m => Math.abs(m.pct)), 1);
  const yearTotal = years.find(y => y.key === String(year));
  const yWeeks = weeks.filter(w => w.key.startsWith(String(year)));
  const maxW = Math.max(...weeks.map(w => Math.abs(w.pct)), 1);

  let cum = 1;
  const chartData = months.map(m => { cum *= 1 + m.pct / 100; return { ...m, cum: (cum - 1) * 100 }; });

  return (
    <div className="space-y-4">
      <Card
        title="تقويم المكسب والخسارة"
        right={<Segmented value={mode} onChange={setMode} options={[{ v: 'month', label: 'شهري' }, { v: 'week', label: 'أسبوعي' }, { v: 'year', label: 'سنوي' }]} />}
      >
        {mode !== 'year' && (
          <div className="mb-5 flex items-center justify-center gap-5">
            <button disabled={year >= maxY} onClick={() => setYear(y => y + 1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{year}</span>
            <button disabled={year <= minY} onClick={() => setYear(y => y - 1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
          </div>
        )}

        {mode === 'month' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {MONTHS_AR.map((name, i) => {
                const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                return <Cell2 key={key} label={name} r={yMonths.find(m => m.key === key)} max={maxAbs} />;
              })}
            </div>
            {yearTotal && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs font-black">
                <span className="text-slate-500">إجمالي {year}</span>
                <span dir="ltr" className={yearTotal.gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{fmtSigned(yearTotal.gain)} ج.م · {fmtPct(yearTotal.pct)}</span>
              </div>
            )}
          </>
        )}

        {mode === 'week' && (
          yWeeks.length ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {yWeeks.map(w => <Cell2 key={w.key} label={fmtDate(w.key).replace(/ \d{4}$/, '')} r={w} max={maxW} />)}
            </div>
          ) : <Empty text="لا توجد أسابيع مسجلة في هذه السنة" />
        )}

        {mode === 'year' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {years.map(y => <Cell2 key={y.key} label={y.key} r={y} max={Math.max(...years.map(v => Math.abs(v.pct)), 1)} />)}
          </div>
        )}
      </Card>

      <Card title="العائد الشهري والتراكمي">
        <div dir="ltr" className="h-64 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis dataKey="key" tickFormatter={(k: string) => MONTHS_EN[+k.slice(5, 7) - 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis orientation="right" tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.5} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} content={<ChartTip labelFmt={monthLabel} rows={p => [
                { name: 'عائد الشهر', value: fmtPct(+p.pct), color: +p.pct >= 0 ? '#34d399' : '#fb7185' },
                { name: 'الربح', value: fmtSigned(+p.gain), color: '#fbbf24' },
                { name: 'التراكمي', value: fmtPct(+p.cum), color: '#818cf8' },
              ]} />} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {chartData.map(d => <Cell key={d.key} fill={d.pct >= 0 ? '#10b981' : '#f43f5e'} />)}
              </Bar>
              <Line type="monotone" dataKey="cum" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="مصفوفة الأداء السنوية">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-center text-[11px] font-black" dir="rtl">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1">السنة</th>
                {MONTHS_AR.map(m => <th key={m} className="px-1 py-1">{m.slice(0, 3)}</th>)}
                <th className="px-2 py-1">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {years.map(y => (
                <tr key={y.key}>
                  <td className="px-2 py-2 text-slate-700 dark:text-slate-200">{y.key}</td>
                  {MONTHS_AR.map((_, i) => {
                    const m = months.find(x => x.key === `${y.key}-${String(i + 1).padStart(2, '0')}`);
                    return (
                      <td key={i} className="rounded-lg px-1 py-2 tabular-nums" dir="ltr" style={m ? { background: bg(m.pct, maxAbs) } : undefined}>
                        {m ? <span className={m.pct >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>{m.pct.toFixed(1)}</span> : <span className="text-slate-300 dark:text-slate-700">·</span>}
                      </td>
                    );
                  })}
                  <td className={cx('rounded-lg px-2 py-2 tabular-nums bg-slate-100 dark:bg-slate-800', y.pct >= 0 ? 'text-emerald-600' : 'text-rose-500')} dir="ltr">{fmtPct(y.pct, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

