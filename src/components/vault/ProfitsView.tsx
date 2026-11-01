import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, Trash2, PiggyBank, HandCoins, Percent } from 'lucide-react';
import { Card, ChartTip, Empty, Field, inputCls, cx } from './ui';
import { useVault } from './VaultContext';
import type { PeriodRet } from './calc';
import { fmt, fmtCompact, fmtPct, monthLabel, MONTHS_EN, profitTotals } from './calc';

const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function ProfitsView({ monthRets, nav, netDeposits }: { monthRets: PeriodRet[]; nav: number; netDeposits: number }) {
  const { months, saveMonth, deleteMonth, settings } = useVault();
  const partner = settings.partner.enabled;
  const [month, setMonth] = useState(monthNow());
  const [f, setF] = useState({ retainedMine: '', retainedPartner: '', distributedMine: '', distributedPartner: '', note: '' });
  const n = (s: string) => parseFloat(s) || 0;

  const totals = profitTotals(months);
  const retained = totals.retainedMine + totals.retainedPartner;
  const distributed = totals.distributedMine + totals.distributedPartner;

  const load = (id: string) => {
    setMonth(id);
    const m = months.find(x => x.id === id);
    setF(m ? { retainedMine: String(m.retainedMine || ''), retainedPartner: String(m.retainedPartner || ''), distributedMine: String(m.distributedMine || ''), distributedPartner: String(m.distributedPartner || ''), note: m.note ?? '' }
      : { retainedMine: '', retainedPartner: '', distributedMine: '', distributedPartner: '', note: '' });
  };

  const save = async () => {
    await saveMonth({ id: month, retainedMine: n(f.retainedMine), retainedPartner: n(f.retainedPartner), distributedMine: n(f.distributedMine), distributedPartner: n(f.distributedPartner), note: f.note || undefined });
  };

  const chart = months.map(m => ({ ...m, key: m.id }));
  const fields: { k: 'retainedMine' | 'retainedPartner' | 'distributedMine' | 'distributedPartner'; label: string; show: boolean; color: string }[] = [
    { k: 'retainedMine', label: 'مجنبة لي', show: true, color: '#38bdf8' },
    { k: 'retainedPartner', label: 'مجنبة للشريك', show: partner, color: '#a78bfa' },
    { k: 'distributedMine', label: 'موزعة لي', show: true, color: '#34d399' },
    { k: 'distributedPartner', label: 'موزعة للشريك', show: partner, color: '#fbbf24' },
  ];

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-[11px] font-bold text-amber-600 dark:text-amber-400">هذا القسم للتتبع فقط — لا يؤثر على القيمة السوقية أو صافي الإيداعات إلا لو سجلت سحباً فعلياً في الحركات.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <K icon={<PiggyBank className="w-4 h-4" />} label="إجمالي المجنب" value={fmt(retained)} cls="text-sky-500" />
        <K icon={<HandCoins className="w-4 h-4" />} label="إجمالي الموزع" value={fmt(distributed)} cls="text-emerald-500" />
        <K icon={<Percent className="w-4 h-4" />} label="من صافي الإيداعات" value={netDeposits > 0 ? `${(((retained + distributed) / netDeposits) * 100).toFixed(1)}%` : '—'} />
        <K icon={<Percent className="w-4 h-4" />} label="من القيمة السوقية" value={nav > 0 ? `${(((retained + distributed) / nav) * 100).toFixed(1)}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card title="تسجيل شهر" className="lg:col-span-2">
          <div className="space-y-3">
            <Field label="الشهر"><input type="month" value={month} onChange={e => load(e.target.value)} className={inputCls} /></Field>

            {(() => {
              const curRet = monthRets.find(x => x.key === month);
              const autoGain = curRet && curRet.gain > 0 ? Math.round(curRet.gain) : 0;
              return partner ? (
                <div className="rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-950/20 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-violet-700 dark:text-violet-300">
                    <span>توزيع سريع (60% لي / 40% {settings.partner.name})</span>
                    <span className="text-[10px] text-slate-400">حاسبة فورية</span>
                  </div>
                  {autoGain > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-violet-200/60 dark:border-violet-800/40 px-2.5 py-1.5 text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        ربح {monthLabel(month)} بالتقويم: <b dir="ltr" className="text-emerald-600 dark:text-emerald-400">+{fmt(autoGain)} ج.م</b>
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                            if (el) el.value = String(autoGain);
                            setF(s => ({
                              ...s,
                              distributedMine: String(Math.round(autoGain * 0.6)),
                              distributedPartner: String(Math.round(autoGain * 0.4)),
                            }));
                          }}
                          className="rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black transition"
                        >
                          ⚡ استيراد كموزع
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                            if (el) el.value = String(autoGain);
                            setF(s => ({
                              ...s,
                              retainedMine: String(Math.round(autoGain * 0.6)),
                              retainedPartner: String(Math.round(autoGain * 0.4)),
                            }));
                          }}
                          className="rounded-md bg-violet-600 hover:bg-violet-500 text-white px-2 py-0.5 text-[10px] font-black transition"
                        >
                          ⚡ استيراد كمجنب
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="إجمالي ربح الشهر..."
                      id="quick_split_val"
                      className={cx(inputCls, '!py-1.5 text-xs text-left tabular-nums')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                        const val = parseFloat(el?.value || '') || 0;
                        if (val > 0) {
                          setF(s => ({
                            ...s,
                            retainedMine: String(Math.round(val * 0.6)),
                            retainedPartner: String(Math.round(val * 0.4)),
                          }));
                        }
                      }}
                      className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm"
                    >
                      كمجنب
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                        const val = parseFloat(el?.value || '') || 0;
                        if (val > 0) {
                          setF(s => ({
                            ...s,
                            distributedMine: String(Math.round(val * 0.6)),
                            distributedPartner: String(Math.round(val * 0.4)),
                          }));
                        }
                      }}
                      className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm"
                    >
                      كموزع
                    </button>
                  </div>
                </div>
              ) : null;
            })()}

            <div className="grid grid-cols-2 gap-3">
              {fields.filter(x => x.show).map(x => (
                <Field key={x.k} label={x.label}>
                  <input inputMode="decimal" dir="ltr" value={f[x.k]} onChange={e => setF(s => ({ ...s, [x.k]: e.target.value }))} placeholder="0" className={cx(inputCls, 'text-left tabular-nums')} style={{ borderTop: `3px solid ${x.color}` }} />
                </Field>
              ))}
            </div>
            <Field label="ملاحظة"><input value={f.note} onChange={e => setF(s => ({ ...s, note: e.target.value }))} className={inputCls} /></Field>
            <button onClick={save} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:brightness-110"><Check className="w-4 h-4" />حفظ {monthLabel(month)}</button>
          </div>
        </Card>

        <Card title="حركة الأرباح شهرياً" className="lg:col-span-3">
          {!chart.length ? <Empty text="لسه مفيش أرباح مسجلة" /> : (
            <div dir="ltr" className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="key" tickFormatter={(k: string) => MONTHS_EN[+k.slice(5, 7) - 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} content={<ChartTip labelFmt={monthLabel} rows={p => fields.filter(x => x.show).map(x => ({ name: x.label, value: fmt(+p[x.k]), color: x.color }))} />} />
                  {fields.filter(x => x.show).map(x => <Bar key={x.k} dataKey={x.k} stackId="a" fill={x.color} maxBarSize={32} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card title="سجل الشهور" pad={false}>
        {!months.length ? <Empty text="لا توجد سجلات" /> : (
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[640px] text-xs font-bold tabular-nums" dir="rtl">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  {['الشهر', 'مجنب', 'موزع', 'ربح الشهر', 'نسبة التجنيب/التوزيع', ''].map(h => <th key={h} className="px-2 py-2.5 text-right font-black">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...months].reverse().map(m => {
                  const r = monthRets.find(x => x.key === m.id);
                  const out = m.retainedMine + m.retainedPartner + m.distributedMine + m.distributedPartner;
                  return (
                    <tr key={m.id} onClick={() => load(m.id)} className="cursor-pointer border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-2 py-3 font-black text-slate-800 dark:text-slate-100">{monthLabel(m.id)}{m.note && <span className="mr-2 text-[10px] font-bold text-slate-400">{m.note}</span>}</td>
                      <td className="px-2 py-3 text-sky-500" dir="ltr">{fmt(m.retainedMine + m.retainedPartner)}</td>
                      <td className="px-2 py-3 text-emerald-500" dir="ltr">{fmt(m.distributedMine + m.distributedPartner)}</td>
                      <td className={cx('px-2 py-3', r ? (r.gain >= 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400')} dir="ltr">{r ? `${fmt(r.gain)} (${fmtPct(r.pct, 1)})` : '—'}</td>
                      <td className="px-2 py-3" dir="ltr">{r && r.gain > 0 ? `${((out / r.gain) * 100).toFixed(0)}%` : '—'}</td>
                      <td className="px-2 py-3"><button onClick={e => { e.stopPropagation(); deleteMonth(m.id); }} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function K({ icon, label, value, cls }: { icon: React.ReactNode; label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">{icon}{label}</div>
      <div dir="ltr" className={cx('mt-1 text-xl font-black tabular-nums text-right', cls)}>{value}</div>
    </div>
  );
}

