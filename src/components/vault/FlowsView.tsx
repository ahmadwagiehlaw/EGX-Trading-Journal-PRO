import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Download, LineChart as LineIcon, Trash2, Printer } from 'lucide-react';
import { Card, ChartTip, Empty, Segmented, cx } from './ui';
import { useVault } from './VaultContext';
import { dayNum, flowsByMonth, flowsByTag, fmt, fmtCompact, fmtDate, fmtSigned, monthLabel, MONTHS_EN } from './calc';

type Filter = 'all' | 'deposit' | 'withdrawal' | 'nav';

export function FlowsView({ scopeIds, onEditFlow, onEditSnap }: { scopeIds: string[]; onEditFlow: (c: import('./types').VaultCashflow) => void; onEditSnap: (pid: string, date: string) => void }) {
  const { settings, cashflows, snapshots, deleteCashflow, deleteSnapshot } = useVault();
  const [filter, setFilter] = useState<Filter>('all');
  const [partyFilter, setPartyFilter] = useState<'all' | 'me' | 'partner'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const pname = (id: string) => settings.portfolios.find(p => p.id === id);

  const flows = useMemo(() => cashflows.filter(c => scopeIds.includes(c.portfolioId) && !c.opening), [cashflows, scopeIds]);
  const portfolioFlows = flows;
  const dep = portfolioFlows.filter(f => f.type === 'deposit').reduce((a, f) => a + f.amount, 0);
  const wd = portfolioFlows.filter(f => f.type === 'withdrawal').reduce((a, f) => a + f.amount, 0);

  // جسر المطابقة المحاسبية مع "صافي الإيداعات" في النظرة العامة:
  // صافي الإيداعات المعتمد = (أقدم قراءة سوقية مسجلة لكل محفظة) + (الإيداعات اللاحقة لها) − (السحوبات اللاحقة لها)
  const recon = useMemo(() => {
    const sortedSnaps = snapshots
      .filter(s => scopeIds.includes(s.portfolioId))
      .sort((a, b) => a.date.localeCompare(b.date));
    const firstByPid = new Map<string, { date: string; total: number }>();
    for (const s of sortedSnaps) {
      if (!firstByPid.has(s.portfolioId)) {
        firstByPid.set(s.portfolioId, { date: s.date, total: s.total });
      }
    }
    let startCap = 0;
    let postDep = 0;
    let postWd = 0;
    let preNet = 0;
    let startDate = '';

    for (const pid of scopeIds) {
      const fs = firstByPid.get(pid);
      if (fs) {
        startCap += fs.total;
        if (!startDate || fs.date < startDate) startDate = fs.date;
        for (const f of portfolioFlows) {
          if (f.portfolioId === pid) {
            if (f.date > fs.date) {
              if (f.type === 'deposit') postDep += f.amount;
              else postWd += f.amount;
            } else {
              preNet += f.type === 'deposit' ? f.amount : -f.amount;
            }
          }
        }
      } else {
        for (const f of portfolioFlows) {
          if (f.portfolioId === pid) {
            if (f.type === 'deposit') postDep += f.amount;
            else postWd += f.amount;
          }
        }
      }
    }

    const netPostFlow = postDep - postWd;
    const netInvestedCapital = startCap + netPostFlow;
    return { startCap, startDate, postDep, postWd, netPostFlow, netInvestedCapital, preNet };
  }, [snapshots, scopeIds, portfolioFlows]);

  const byMonth = useMemo(() => flowsByMonth(portfolioFlows), [portfolioFlows]);
  const byTag = useMemo(() => flowsByTag(portfolioFlows), [portfolioFlows]);
  const maxTag = Math.max(...byTag.map(t => Math.max(t.deposit, t.withdrawal)), 1);

  type Row =
    | { id: string; kind: 'deposit' | 'withdrawal'; date: string; ts: number; pid: string; label: string; emoji: string; amount: number; note?: string; partner?: boolean }
    | { id: string; kind: 'nav'; date: string; ts: number; label: string; emoji: string; amount: number; note?: string; items: { pid: string; total: number; note?: string }[] };

  const rows: Row[] = useMemo(() => {
    // 1. Individual Cashflows
    const a: Row[] = flows.map(f => ({
      id: f.id,
      kind: f.type,
      date: f.date,
      ts: f.createdAt,
      pid: f.portfolioId,
      label: f.tag,
      emoji: f.emoji ?? '',
      amount: f.amount,
      note: f.note,
      partner: f.partner,
    }));

    // 2. Group Snapshots by date
    const scopedSnaps = snapshots.filter(s => scopeIds.includes(s.portfolioId));
    const snapsByDate: Record<string, typeof scopedSnaps> = {};
    scopedSnaps.forEach(s => {
      if (!snapsByDate[s.date]) snapsByDate[s.date] = [];
      snapsByDate[s.date].push(s);
    });

    const b: Row[] = Object.entries(snapsByDate).map(([date, items]) => {
      const sum = items.reduce((acc, cur) => acc + cur.total, 0);
      const maxTs = Math.max(...items.map(i => i.createdAt || 0), 0);
      const note = items.map(i => i.note).filter(Boolean).join(' | ');
      return {
        id: `snap_group_${date}`,
        kind: 'nav' as const,
        date,
        ts: maxTs,
        label: 'تسجيل قيمة سوقية',
        emoji: '📊',
        amount: sum,
        note: note || undefined,
        items: items.map(i => ({ pid: i.portfolioId, total: i.total, note: i.note })),
      };
    });

    return [...a, ...b]
      .filter(r => filter === 'all' || r.kind === filter)
      .filter(r => {
        if (partyFilter === 'all') return true;
        if (r.kind === 'nav') return true;
        if (partyFilter === 'partner') return Boolean(r.partner);
        return !r.partner;
      })
      .filter(r => !tagFilter || r.label === tagFilter)
      .sort((x, y) => {
        const dx = dayNum(x.date) || 0;
        const dy = dayNum(y.date) || 0;
        if (dy !== dx) return dy - dx;
        return (y.ts || 0) - (x.ts || 0);
      });
  }, [flows, snapshots, scopeIds, filter, partyFilter, tagFilter]);

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = rows.map((r, i) => {
      const isDep = r.kind === 'deposit';
      const isWd = r.kind === 'withdrawal';
      const isNav = r.kind === 'nav';
      const typeLabel = isDep ? 'إيداع' : isWd ? 'سحب' : 'قيمة سوقية';
      const color = isDep ? '#10b981' : isWd ? '#f43f5e' : '#6366f1';
      const sign = isDep ? '+' : isWd ? '−' : '';
      const p = !isNav ? pname(r.pid) : null;
      const portfolioContent = isNav
        ? r.items.map(it => `${pname(it.pid)?.name || ''}: ${fmt(it.total)}`).join(' | ')
        : (p?.name || '—');

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 12px; font-size: 12px; color: #64748b;">${i + 1}</td>
          <td style="padding: 10px 12px; font-weight: bold; font-size: 13px;">${fmtDate(r.date)}</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background: ${color}15; color: ${color};">
              ${typeLabel}
            </span>
          </td>
          <td style="padding: 10px 12px; font-weight: bold; font-size: 12px;">
            ${portfolioContent}
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
    const lines = rows.map(r => {
      const pName = r.kind === 'nav'
        ? r.items.map(it => `${pname(it.pid)?.name || ''}: ${it.total}`).join(' | ')
        : (pname(r.pid)?.name ?? '');
      return [
        r.date,
        r.kind === 'deposit' ? 'إيداع' : r.kind === 'withdrawal' ? 'سحب' : 'قيمة سوقية',
        `"${pName.replace(/"/g, '""')}"`,
        r.label,
        r.amount,
        (r.note ?? '').replace(/,/g, ' '),
      ].join(',');
    });
    const blob = new Blob(['\ufeff' + [head, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vault-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="رصيد انطلاق المحفظة (أقدم قراءة)"
          value={fmt(recon.startCap)}
          sub={recon.startDate ? `معتمد بتاريخ ${fmtDate(recon.startDate)}` : 'لم تُسجل قراءة بعد'}
          cls="text-slate-800 dark:text-slate-100"
        />
        <Stat
          label="إجمالي الإيداعات (بعد الانطلاق)"
          value={`+${fmt(recon.postDep)}`}
          sub={dep !== recon.postDep ? `إجمالي كل السجل: +${fmt(dep)} ج.م` : 'كل الإيداعات النقدية المضافة'}
          cls="text-emerald-500"
        />
        <Stat
          label="إجمالي السحوبات (بعد الانطلاق)"
          value={`−${fmt(recon.postWd)}`}
          sub={wd !== recon.postWd ? `إجمالي كل السجل: −${fmt(wd)} ج.م` : `نسبة السحب: ${recon.postDep > 0 ? ((recon.postWd / recon.postDep) * 100).toFixed(1) : 0}%`}
          cls="text-rose-500"
        />
        <Stat
          label="صافي الإيداعات المعتمد (المطابق للنظرة العامة)"
          value={fmt(recon.netInvestedCapital)}
          sub={`${fmt(recon.startCap)} بداية ${fmtSigned(recon.netPostFlow)} صافي الحركات`}
          cls="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="الإيداع والسحب شهرياً">
          {!byMonth.length ? <Empty text="لا توجد حركات" /> : (
            <div dir="ltr" className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byMonth.map(m => ({ ...m, wdNeg: -m.withdrawal }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(k: string) => MONTHS_EN[+k.slice(5, 7) - 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[11px] font-black">
              {[
                { v: 'all', label: 'الكل' },
                { v: 'me', label: '👤 أنا' },
                { v: 'partner', label: `👥 ${settings.partner?.name || 'الشريك'}` },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setPartyFilter(opt.v as any)}
                  className={cx(
                    'rounded-lg px-2.5 py-1 transition-all',
                    partyFilter === opt.v
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
              const isNav = r.kind === 'nav';
              const p = !isNav ? pname(r.pid) : null;
              return (
                <li
                  key={r.kind + r.id}
                  onClick={() => {
                    if (isNav) {
                      onEditSnap(r.items[0]?.pid || '', r.date);
                    } else {
                      const c = cashflows.find(x => x.id === r.id);
                      if (c) onEditFlow(c);
                    }
                  }}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                >
                  <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5', r.kind === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : r.kind === 'withdrawal' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400')}>
                    {r.kind === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : r.kind === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> : <LineIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100">
                      <span>{r.emoji} {r.label}</span>
                      {p && <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: p.color }}>{p.name}</span>}
                      
                      {/* الطرف: أنا vs الشريك */}
                      {!isNav && (
                        r.partner ? (
                          <span className="rounded-full bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 text-[10px] font-black text-purple-600 dark:text-purple-400">
                            👥 {settings.partner?.name || 'الشريك'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            👤 أنا
                          </span>
                        )
                      )}

                      {/* شارات وظيفية ذكية */}
                      {!isNav && (r.label === 'جني أرباح' || r.label === 'أرباح الشريك' || (r.kind === 'withdrawal' && r.label.includes('أرباح'))) && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          🎯 ربح مسحوب
                        </span>
                      )}
                      {!isNav && (r.label === 'سداد الفيزا' || r.label.includes('فيزا')) && (
                        <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400">
                          💳 سداد التزامات
                        </span>
                      )}
                      {!isNav && r.label === 'زيادة رأس المال' && (
                        <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-black text-teal-600 dark:text-teal-400">
                          🚀 زيادة رأسمال
                        </span>
                      )}
                      {!isNav && r.label === 'تخفيض رأس المال' && (
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">
                          🔻 تخفيض رأسمال
                        </span>
                      )}

                      {isNav && <span className="text-[10px] font-bold text-slate-400">({fmtDate(r.date)})</span>}
                    </div>

                    {isNav ? (
                      /* Grouped portfolios breakdown pills */
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {r.items.map(it => {
                          const itP = pname(it.pid);
                          if (!itP) return null;
                          return (
                            <span
                              key={it.pid}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                            >
                              <i className="w-1.5 h-1.5 rounded-full" style={{ background: itP.color }} />
                              <span>{itP.name}:</span>
                              <b dir="ltr" className="tabular-nums font-mono">{fmt(it.total)}</b>
                            </span>
                          );
                        })}
                        {r.note && <span className="text-[10px] text-slate-400 truncate">· {r.note}</span>}
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-slate-400 truncate">{fmtDate(r.date)}{r.note ? ` · ${r.note}` : ''}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div dir="ltr" className={cx('text-sm sm:text-base font-black tabular-nums', r.kind === 'deposit' ? 'text-emerald-500' : r.kind === 'withdrawal' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100')}>
                      {r.kind === 'deposit' ? '+' : r.kind === 'withdrawal' ? '−' : ''}{fmt(r.amount)} <span className="text-[10px] font-bold text-slate-400">ج.م</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isNav && (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500 transition-colors">
                          تعديل ✏️
                        </span>
                      )}
                      {confirm === r.id ? (
                        <button
                          onClick={async e => {
                            e.stopPropagation();
                            if (isNav) {
                              for (const it of r.items) {
                                await deleteSnapshot(`${it.pid}_${r.date}`);
                              }
                            } else {
                              await deleteCashflow(r.id);
                            }
                            setConfirm(null);
                          }}
                          className="rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white shadow-xs"
                        >
                          تأكيد الحذف
                        </button>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setConfirm(r.id);
                            setTimeout(() => setConfirm(c => (c === r.id ? null : c)), 3000);
                          }}
                          title={isNav ? "حذف تسجيل القيمة السوقية لهذا اليوم بالكامل" : "حذف الحركة"}
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, cls }: { label: string; value: string; sub?: string; cls?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4">
      <div className="text-[11px] font-black text-slate-400">{label}</div>
      <div dir="ltr" className={cx('mt-1 text-xl font-black tabular-nums text-right', cls)}>{value}</div>
      {sub && <div className="mt-1 text-[10px] font-bold text-slate-400 truncate">{sub}</div>}
    </div>
  );
}

