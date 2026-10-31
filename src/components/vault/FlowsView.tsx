import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Download, LineChart as LineIcon, Trash2 } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx, tone } from './ui';
import { useVault } from './VaultContext';
import { flowsByMonth, flowsByTag, fmt, fmtCompact, fmtDate, fmtSigned, monthLabel, MONTHS_AR } from './calc';

type Filter = 'all' | 'deposit' | 'withdrawal' | 'nav';

export function FlowsView({ scopeIds, onEditFlow, onEditSnap }: { scopeIds: string[]; onEditFlow: (c: import('./types').VaultCashflow) => void; onEditSnap: (pid: string, date: string) => void }) {
  const { settings, cashflows, snapshots, deleteCashflow, deleteSnapshot } = useVault();
  const [filter, setFilter] = useState<Filter>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const pname = (id: string) => settings.portfolios.find(p => p.id === id);

  const flows = useMemo(() => cashflows.filter(c => scopeIds.includes(c.portfolioId)), [cashflows, scopeIds]);
  const dep = flows.filter(f => f.type === 'deposit').reduce((a, f) => a + f.amount, 0);
  const wd = flows.filter(f => f.type === 'withdrawal').reduce((a, f) => a + f.amount, 0);
  const byMonth = useMemo(() => flowsByMonth(flows), [flows]);
  const byTag = useMemo(() => flowsByTag(flows), [flows]);
  const maxTag = Math.max(...byTag.map(t => Math.max(t.deposit, t.withdrawal)), 1);

  type Row = { id: string; kind: 'deposit' | 'withdrawal' | 'nav'; date: string; ts: number; pid: string; label: string; emoji: string; amount: number; note?: string };
  const rows: Row[] = useMemo(() => {
    const a: Row[] = flows.map(f => ({ id: f.id, kind: f.type, date: f.date, ts: f.createdAt, pid: f.portfolioId, label: f.tag, emoji: f.emoji ?? '', amount: f.amount, note: f.note }));
    const b: Row[] = snapshots.filter(s => scopeIds.includes(s.portfolioId)).map(s => ({ id: s.id, kind: 'nav', date: s.date, ts: s.createdAt, pid: s.portfolioId, label: 'قيمة سوقية', emoji: '📊', amount: s.total, note: s.note }));
    return [...a, ...b]
      .filter(r => filter === 'all' || r.kind === filter)
      .filter(r => !tagFilter || r.label === tagFilter)
      .sort((x, y) => y.date.localeCompare(x.date) || y.ts - x.ts);
  }, [flows, snapshots, scopeIds, filter, tagFilter]);

  const exportCsv = () => {
    const head = 'التاريخ,النوع,المحفظة,التصنيف,المبلغ,ملاحظة';
    const lines = rows.map(r => [r.date, r.kind === 'deposit' ? 'إيداع' : r.kind === 'withdrawal' ? 'سحب' : 'قيمة سوقية', pname(r.pid)?.name ?? '', r.label, r.amount, (r.note ?? '').replace(/,/g, ' ')].join(','));
    const blob = new Blob(['\ufeff' + [head, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vault-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="إجمالي الإيداعات" value={fmt(dep)} cls="text-emerald-500" />
        <Stat label="إجمالي السحوبات" value={fmt(wd)} cls="text-rose-500" />
        <Stat label="الصافي" value={fmtSigned(dep - wd)} cls={tone(dep - wd)} />
        <Stat label="السحب ÷ الإيداع" value={dep > 0 ? `${((wd / dep) * 100).toFixed(1)}%` : '—'} cls="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="الإيداع والسحب شهرياً">
          {!byMonth.length ? <Empty text="لا توجد حركات" /> : (
            <div dir="ltr" className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byMonth.map(m => ({ ...m, wdNeg: -m.withdrawal }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(k: string) => MONTHS_AR[+k.slice(5, 7) - 1].slice(0, 3)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={0.5} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} content={<ChartTip labelFmt={monthLabel} rows={p => [
                    { name: 'إيداع', value: fmt(+p.deposit), color: '#10b981' }, { name: 'سحب', value: fmt(+p.withdrawal), color: '#f43f5e' }, { name: 'الصافي', value: fmtSigned(+p.net), color: '#818cf8' }]} />} />
                  <Bar dataKey="deposit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="wdNeg" fill="#f43f5e" radius={[0, 0, 6, 6]} maxBarSize={28} />
                  <Line type="monotone" dataKey="net" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="حسب التصنيف">
          {!byTag.length ? <Empty text="لا توجد حركات" /> : (
            <div className="space-y-3 max-h-64 overflow-y-auto pl-1">
              {byTag.map(t => (
                <button key={t.tag} onClick={() => setTagFilter(tagFilter === t.tag ? '' : t.tag)} className={cx('block w-full text-right rounded-xl p-2 transition', tagFilter === t.tag && 'bg-slate-100 dark:bg-slate-800')}>
                  <div className="flex justify-between text-xs font-black mb-1.5"><span>{t.emoji} {t.tag}</span>
                    <span dir="ltr" className="tabular-nums text-slate-400">{t.deposit > 0 && <b className="text-emerald-500">+{fmt(t.deposit)} </b>}{t.withdrawal > 0 && <b className="text-rose-500">−{fmt(t.withdrawal)}</b>}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex" dir="ltr">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(t.deposit / maxTag) * 50}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${(t.withdrawal / maxTag) * 50}%` }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="السجل"
        right={
          <div className="flex items-center gap-2">
            <Segmented size="sm" value={filter} onChange={setFilter} options={[{ v: 'all', label: 'الكل' }, { v: 'deposit', label: 'إيداع' }, { v: 'withdrawal', label: 'سحب' }, { v: 'nav', label: 'قيم سوقية' }]} />
            <button onClick={exportCsv} title="تصدير CSV" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"><Download className="w-4 h-4" /></button>
          </div>
        }
        pad={false}
      >
        {tagFilter && <div className="px-5 pt-3"><button onClick={() => setTagFilter('')} className="rounded-full bg-orange-500/10 text-orange-500 px-3 py-1 text-[11px] font-black">التصنيف: {tagFilter} ×</button></div>}
        {!rows.length ? <Empty text="السجل فارغ" /> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/70 p-2">
            {rows.map(r => {
              const p = pname(r.pid);
              return (
                <li key={r.kind + r.id} onClick={() => { if (r.kind === 'nav') onEditSnap(r.pid, r.date); else { const c = cashflows.find(x => x.id === r.id); if (c) onEditFlow(c); } }} className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', r.kind === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : r.kind === 'withdrawal' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-400')}>
                    {r.kind === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : r.kind === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> : <LineIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
                      <span>{r.emoji} {r.label}</span>
                      {p && <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: p.color }}>{p.name}</span>}
                      {flows.find(x => x.id === r.id)?.partner && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-black text-violet-500">شريك</span>}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 truncate">{fmtDate(r.date)}{r.note ? ` · ${r.note}` : ''}</div>
                  </div>
                  <div dir="ltr" className={cx('text-sm font-black tabular-nums', r.kind === 'deposit' ? 'text-emerald-500' : r.kind === 'withdrawal' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200')}>
                    {r.kind === 'deposit' ? '+' : r.kind === 'withdrawal' ? '−' : ''}{fmt(r.amount)}
                  </div>
                  {confirm === r.id ? (
                    <button onClick={e => { e.stopPropagation(); (r.kind === 'nav' ? deleteSnapshot : deleteCashflow)(r.id); setConfirm(null); }} className="rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white">تأكيد</button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirm(r.id); setTimeout(() => setConfirm(c => (c === r.id ? null : c)), 3000); }} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4">
      <div className="text-[11px] font-black text-slate-400">{label}</div>
      <div dir="ltr" className={cx('mt-1 text-xl font-black tabular-nums text-right', cls)}>{value}</div>
    </div>
  );
}

