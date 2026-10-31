import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Download, LineChart as LineIcon, Trash2, Printer } from 'lucide-react';
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
  const portfolioFlows = useMemo(() => flows.filter(f => !f.partner), [flows]);
  const dep = portfolioFlows.filter(f => f.type === 'deposit').reduce((a, f) => a + f.amount, 0);
  const wd = portfolioFlows.filter(f => f.type === 'withdrawal').reduce((a, f) => a + f.amount, 0);
  const byMonth = useMemo(() => flowsByMonth(portfolioFlows), [portfolioFlows]);
  const byTag = useMemo(() => flowsByTag(portfolioFlows), [portfolioFlows]);
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

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = rows.map((r, i) => {
      const p = pname(r.pid);
      const isDep = r.kind === 'deposit';
      const isWd = r.kind === 'withdrawal';
      const typeLabel = isDep ? 'إيداع' : isWd ? 'سحب' : 'قيمة سوقية';
      const color = isDep ? '#10b981' : isWd ? '#f43f5e' : '#6366f1';
      const sign = isDep ? '+' : isWd ? '−' : '';
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 12px; font-size: 12px; color: #64748b;">${i + 1}</td>
          <td style="padding: 10px 12px; font-weight: bold; font-size: 13px;">${fmtDate(r.date)}</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background: ${color}15; color: ${color};">
              ${typeLabel}
            </span>
          </td>
          <td style="padding: 10px 12px; font-weight: bold;">
            <span style="display: inline-flex; align-items: center; gap: 5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${p?.color || '#cbd5e1'};"></span>
              ${p?.name || '—'}
            </span>
          </td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: bold;">${r.emoji} ${r.label}</td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 800; direction: ltr; text-align: left; color: ${color};">
            ${sign}${fmt(r.amount)} ج.م
          </td>
          <td style="padding: 10px 12px; font-size: 11px; color: #64748b;">${r.note || '—'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>تقرير حركات الخزنة والمركز المالي</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 24px;
              color: #0f172a;
              background: #fff;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .logo-area h1 { margin: 0; font-size: 22px; font-weight: 900; color: #ea580c; }
            .logo-area p { margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
            .kpis {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .kpi-box {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px;
              background: #f8fafc;
            }
            .kpi-box .lbl { font-size: 11px; color: #64748b; font-weight: bold; }
            .kpi-box .val { font-size: 18px; font-weight: 900; margin-top: 4px; direction: ltr; text-align: left; }
            table { width: 100%; border-collapse: collapse; text-align: right; }
            th {
              background: #f1f5f9;
              padding: 10px 12px;
              font-size: 11px;
              font-weight: 900;
              color: #475569;
              border-bottom: 2px solid #cbd5e1;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <h1>🏛️ تقرير المركز المالي والخزنة</h1>
              <p>EGX Trading Journal PRO · تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <div class="no-print">
              <button onclick="window.print()" style="background: #ea580c; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-family: inherit; font-weight: bold; cursor: pointer; font-size: 13px;">
                🖨️ طباعة / حفظ كـ PDF
              </button>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-box">
              <div class="lbl">إجمالي الإيداعات</div>
              <div class="val" style="color: #10b981;">+${fmt(dep)} ج.م</div>
            </div>
            <div class="kpi-box">
              <div class="lbl">إجمالي السحوبات</div>
              <div class="val" style="color: #f43f5e;">−${fmt(wd)} ج.م</div>
            </div>
            <div class="kpi-box">
              <div class="lbl">صافي التدفق</div>
              <div class="val" style="color: #4f46e5;">${fmtSigned(dep - wd)} ج.م</div>
            </div>
            <div class="kpi-box">
              <div class="lbl">عدد العمليات بالسجل</div>
              <div class="val" style="color: #0f172a;">${rows.length} عملية</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>المحفظة</th>
                <th>التصنيف</th>
                <th style="direction: ltr; text-align: left;">المبلغ</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
            <button onClick={exportPdf} title="طباعة / تصدير PDF" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Printer className="w-4 h-4" /></button>
            <button onClick={exportCsv} title="تصدير CSV" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
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

