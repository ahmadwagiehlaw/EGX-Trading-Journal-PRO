import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Plus, AlertTriangle } from 'lucide-react';
import { Modal, Field, inputCls, Segmented, cx } from './ui';
import { useVault } from './VaultContext';
import { ASSET_KEYS, ASSET_META } from './types';
import type { AssetKey, VaultCashflow } from './types';
import { todayStr, fmt, fmtDate } from './calc';

const num = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function PortfolioPills({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { settings } = useVault();
  return (
    <div className="flex flex-wrap gap-2">
      {settings.portfolios.filter(p => p.active).map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={cx('flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition-all',
            value === p.id ? 'text-white shadow-md scale-[1.03]' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-300')}
          style={value === p.id ? { background: p.color, borderColor: p.color } : undefined}
        >
          <i className="w-2 h-2 rounded-full" style={{ background: value === p.id ? '#fff' : p.color }} />
          {p.name}
        </button>
      ))}
    </div>
  );
}

/* ───────── Snapshot (market value) ───────── */
export function SnapshotModal({ open, onClose, initialPortfolio, editDate }: { open: boolean; onClose: () => void; initialPortfolio?: string; editDate?: string }) {
  const { settings, snapshots, saveSnapshot } = useVault();
  const active = settings.portfolios.filter(p => p.active);
  const [mode, setMode] = useState<'quick' | 'detail'>('quick');
  const [date, setDate] = useState(todayStr());
  const [pid, setPid] = useState(initialPortfolio ?? active[0]?.id ?? '');
  const [totals, setTotals] = useState<Record<string, string>>({});
  const [parts, setParts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open && initialPortfolio) setPid(initialPortfolio); }, [open, initialPortfolio]);
  useEffect(() => {
    if (!open) return;
    if (editDate) {
      setDate(editDate);
      const e = snapshots.find(s => s.portfolioId === (initialPortfolio ?? pid) && s.date === editDate);
      setMode(e?.breakdown && Object.keys(e.breakdown).length ? 'detail' : 'quick');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editDate]);

  const existing = (id: string) => snapshots.find(s => s.portfolioId === id && s.date === date);
  const latest = (id: string) => snapshots.filter(s => s.portfolioId === id).sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestWithBreakdown = (id: string) => snapshots.filter(s => s.portfolioId === id && s.breakdown && Object.keys(s.breakdown).length > 0 && s.date !== date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const prevBreakdown = latestWithBreakdown(pid);
  const copyPrevBreakdown = () => {
    if (!prevBreakdown?.breakdown) return;
    const next: Record<string, string> = {};
    ASSET_KEYS.forEach(k => {
      if (prevBreakdown.breakdown?.[k]) next[k] = String(prevBreakdown.breakdown[k]);
    });
    setParts(next);
    syncDetailToTotals(next);
  };

  // prefill when date / mode / portfolio changes
  useEffect(() => {
    if (!open) return;
    const t: Record<string, string> = {};
    active.forEach(p => { const e = snapshots.find(s => s.portfolioId === p.id && s.date === date); if (e) t[p.id] = String(e.total); });
    setTotals(t);
    const e = snapshots.find(s => s.portfolioId === pid && s.date === date);
    const pp: Record<string, string> = {};
    if (e?.breakdown) ASSET_KEYS.forEach(k => { if (e.breakdown?.[k]) pp[k] = String(e.breakdown[k]); });
    setParts(pp);
    setNote(e?.note ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date, pid, snapshots.length]);

  const detailSum = useMemo(() => ASSET_KEYS.reduce((a, k) => a + num(parts[k] ?? ''), 0), [parts]);

  // Sync from details to total of current portfolio if quick totals was empty or updated
  const syncDetailToTotals = (newParts: Record<string, string>) => {
    const sum = ASSET_KEYS.reduce((a, k) => a + num(newParts[k] ?? ''), 0);
    if (sum > 0) {
      setTotals(t => ({ ...t, [pid]: String(sum) }));
    }
  };

  // Check for large sudden jumps/increases to warn about possible unrecorded deposits
  const warnings = useMemo(() => {
    const alerts: { name: string; current: number; prev: number; diff: number; pct: number }[] = [];
    if (mode === 'quick') {
      active.forEach(p => {
        const val = num(totals[p.id] ?? '');
        const l = latest(p.id);
        if (val > 0 && l && l.total > 0 && l.date !== date) {
          const diff = val - l.total;
          const pct = (diff / l.total) * 100;
          // Trigger if increased by more than 15% AND more than 15,000 EGP
          if (pct >= 15 && diff >= 15000) {
            alerts.push({ name: p.name, current: val, prev: l.total, diff, pct });
          }
        }
      });
    } else {
      const p = active.find(x => x.id === pid);
      const l = latest(pid);
      if (p && detailSum > 0 && l && l.total > 0 && l.date !== date) {
        const diff = detailSum - l.total;
        const pct = (diff / l.total) * 100;
        if (pct >= 15 && diff >= 15000) {
          alerts.push({ name: p.name, current: detailSum, prev: l.total, diff, pct });
        }
      }
    }
    return alerts;
  }, [mode, totals, parts, detailSum, pid, active, latest, date]);

  const fillAllLatest = () => {
    const t: Record<string, string> = { ...totals };
    active.forEach(p => {
      const l = latest(p.id);
      if (l) t[p.id] = String(l.total);
    });
    setTotals(t);
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'quick') {
        for (const p of active) {
          const raw = totals[p.id];
          if (raw === undefined || raw === '') continue;
          const prev = existing(p.id);
          await saveSnapshot({ portfolioId: p.id, date, total: num(raw), breakdown: prev?.breakdown && num(raw) === prev.total ? prev.breakdown : undefined, note: prev?.note });
        }
      } else {
        const bd: Partial<Record<AssetKey, number>> = {};
        ASSET_KEYS.forEach(k => { const v = num(parts[k] ?? ''); if (v) bd[k] = v; });
        await saveSnapshot({ portfolioId: pid, date, total: detailSum, breakdown: bd, note: note || undefined });
      }
      onClose();
    } finally { setBusy(false); }
  };

  const canSave = mode === 'quick' ? Object.values(totals).some(v => v !== '') : detailSum > 0;

  return (
    <Modal open={open} onClose={onClose} title="تسجيل القيمة السوقية">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Segmented value={mode} onChange={setMode} options={[{ v: 'quick', label: 'كل المحافظ' }, { v: 'detail', label: 'تفصيلي بالأصول' }]} />
          <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} disabled={!!editDate} className={cx(inputCls, '!w-auto')} />
        </div>

        {mode === 'quick' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold text-slate-400">سجل القيمة الجديدة لكل محفظة أو أدرج آخر قيمة بضغطة زر:</span>
              <button
                type="button"
                onClick={fillAllLatest}
                className="text-xs font-black text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>نسخ آخر القيم للكل</span>
                <span className="text-sm">⚡</span>
              </button>
            </div>
            {active.map(p => {
              const l = latest(p.id);
              return (
                <div key={p.id} className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                  <i className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                  <div className="w-20 text-sm font-black text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                  <input
                    inputMode="decimal" dir="ltr"
                    value={totals[p.id] ?? ''}
                    onChange={e => setTotals(t => ({ ...t, [p.id]: e.target.value }))}
                    placeholder={l ? `آخر قيمة ${fmt(l.total)}` : '0'}
                    className={cx(inputCls, 'text-left tabular-nums flex-1')}
                  />
                  {l && (
                    <button
                      type="button"
                      title={`إدراج آخر قيمة (${fmt(l.total)})`}
                      onClick={() => setTotals(t => ({ ...t, [p.id]: String(l.total) }))}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-all shrink-0"
                    >
                      إدراج
                    </button>
                  )}
                  {existing(p.id) && <span className="text-[10px] font-black text-amber-500 shrink-0">مسجل</span>}
                </div>
              );
            })}
            <p className="text-[11px] font-bold text-slate-400">اترك المحفظة فارغة لو مش عايز تسجل لها قيمة في هذا اليوم.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PortfolioPills value={pid} onChange={setPid} />
              {totals[pid] && num(totals[pid]) > 0 && (
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  القيمة المسجلة مسبقاً: <b dir="ltr" className="text-orange-500 tabular-nums">{fmt(num(totals[pid]))}</b>
                </span>
              )}
            </div>

            {prevBreakdown && (!parts || Object.values(parts).every(v => !v || v === '0')) && (
              <div className="flex items-center justify-between rounded-2xl bg-orange-500/10 border border-orange-500/20 px-3.5 py-2.5 text-xs font-black text-orange-600 dark:text-orange-400">
                <span className="truncate">توجد تفاصيل أصول سابقة بتاريخ ({fmtDate(prevBreakdown.date)})</span>
                <button
                  type="button"
                  onClick={copyPrevBreakdown}
                  className="rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 text-white px-3 py-1 text-[11px] font-black shadow-sm shadow-orange-500/20 hover:brightness-110 transition shrink-0"
                >
                  نسخ تفاصيل آخر تسجيل ⚡
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {ASSET_KEYS.map(k => {
                const curVal = totals[pid] ? num(totals[pid]) : 0;
                return (
                  <div key={k} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3" style={{ borderTopColor: ASSET_META[k].color, borderTopWidth: 3 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{ASSET_META[k].emoji} {ASSET_META[k].label}</span>
                      {curVal > 0 && (
                        <button
                          type="button"
                          title="إدراج كل قيمة المحفظة بالكامل في هذا الحقل"
                          onClick={() => {
                            const next = { ...parts, [k]: String(curVal) };
                            setParts(next);
                            syncDetailToTotals(next);
                          }}
                          className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-500 transition-all"
                        >
                          كل المحفظة
                        </button>
                      )}
                    </div>
                    <input
                      inputMode="decimal" dir="ltr"
                      value={parts[k] ?? ''}
                      onChange={e => {
                        const next = { ...parts, [k]: e.target.value };
                        setParts(next);
                        syncDetailToTotals(next);
                      }}
                      placeholder="0"
                      className={cx(inputCls, 'text-left tabular-nums !py-2')}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-white">
              <span className="text-xs font-bold text-slate-300">الإجمالي المحسوب</span>
              <span dir="ltr" className="text-xl font-black tabular-nums">{fmt(detailSum)}</span>
            </div>
            <Field label="ملاحظة"><input value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تنبيه: قفزة كبيرة في قيمة المحفظة مقارنة بآخر تسجيل!</span>
            </div>
            {warnings.map(w => (
              <div key={w.name} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed pr-6">
                محفظة <b className="text-slate-900 dark:text-white">{w.name}</b> زادت بمقدار <span dir="ltr" className="text-emerald-500 font-black tabular-nums">+{fmt(w.diff)} ج.م</span> (+{w.pct.toFixed(1)}%).
                <span className="block text-slate-500 dark:text-slate-400 text-[10px]">تأكد إذا كانت هذه الزيادة نتيجة إيداع نقدي جديد يجب تسجيله في "الحركات النقدية" أولاً لكي لا تُحسب كأرباح تداول بالخطأ.</span>
              </div>
            ))}
          </div>
        )}

        <button disabled={!canSave || busy} onClick={submit} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 disabled:opacity-40 hover:brightness-110 transition">
          <Check className="w-4 h-4" /> حفظ
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Cashflow ───────── */
export function CashflowModal({ open, onClose, initialType = 'deposit', editing }: { open: boolean; onClose: () => void; initialType?: 'deposit' | 'withdrawal'; editing?: VaultCashflow }) {
  const { settings, addCashflow, updateCashflow, saveSettings } = useVault();
  const [isPartner, setIsPartner] = useState(false);
  const active = settings.portfolios.filter(p => p.active);
  const [type, setType] = useState<'deposit' | 'withdrawal'>(initialType);
  const [pid, setPid] = useState(active[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [tag, setTag] = useState('');
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open && editing) { setType(editing.type); setPid(editing.portfolioId); setAmount(String(editing.amount)); setDate(editing.date); setTag(editing.tag); setCustom(''); setNote(editing.note ?? ''); setIsPartner(!!editing.partner); } else if (open) { setType(initialType); setTag(''); setAmount(''); setNote(''); setCustom(''); setDate(todayStr()); setIsPartner(false); if (!pid && active[0]) setPid(active[0].id); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, initialType, editing?.id]);

  const tags = settings.tags[type];
  const isDep = type === 'deposit';

  const submit = async () => {
    const label = custom.trim() || tag;
    if (!num(amount) || !pid) return;
    setBusy(true);
    try {
      let emoji = tags.find(t => t.label === label)?.emoji ?? '🏷️';
      if (custom.trim() && !tags.some(t => t.label === label)) {
        emoji = '🏷️';
        await saveSettings({ ...settings, tags: { ...settings.tags, [type]: [...tags, { label, emoji }] } });
      }
      const finalTag = label || (isPartner ? 'رأس مال الشريك' : isDep ? 'إيداع' : 'سحب');
      if (editing) await updateCashflow(editing.id, { portfolioId: pid, type, amount: Math.abs(num(amount)), date, tag: finalTag, emoji, note: note || '', partner: isPartner });
      else await addCashflow({ portfolioId: pid, type, amount: Math.abs(num(amount)), date, tag: finalTag, emoji, note: note || undefined, partner: isPartner || undefined });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'تعديل حركة' : 'حركة نقدية'}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {(['deposit', 'withdrawal'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setTag(''); }}
              className={cx('flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-black transition-all',
                type === t ? (t === 'deposit' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400') : 'border-slate-200 dark:border-slate-700 text-slate-400')}>
              {t === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              {t === 'deposit' ? 'إيداع' : 'سحب'}
            </button>
          ))}
        </div>

        <Field label="المحفظة"><PortfolioPills value={pid} onChange={setPid} /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="المبلغ"><input inputMode="decimal" dir="ltr" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className={cx(inputCls, 'text-left tabular-nums text-lg')} /></Field>
          <Field label="التاريخ"><input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} className={inputCls} /></Field>
        </div>

        <Field label="التصنيف">
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button key={t.label} type="button" onClick={() => { setTag(t.label); setCustom(''); }}
                className={cx('rounded-xl border px-3 py-1.5 text-xs font-black transition-all',
                  tag === t.label && !custom ? (isDep ? 'bg-emerald-500 border-emerald-500 text-white shadow' : 'bg-rose-500 border-rose-500 text-white shadow') : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400')}>
                <span className="ml-1">{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-400" />
            <input value={custom} onChange={e => { setCustom(e.target.value); setTag(''); }} placeholder="تصنيف جديد (يتحفظ تلقائياً)" className={cx(inputCls, '!py-2')} />
          </div>
        </Field>

        <Field label="ملاحظة"><input value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field>

        {settings.partner.enabled && (
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
            <span className="text-xs font-black text-violet-600 dark:text-violet-400">حركة تخص {settings.partner.name} (من رأس ماله)</span>
            <input type="checkbox" checked={isPartner} onChange={e => setIsPartner(e.target.checked)} className="h-5 w-5 accent-violet-500" />
          </label>
        )}

        <button disabled={!num(amount) || busy} onClick={submit}
          className={cx('w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white shadow-lg disabled:opacity-40 hover:brightness-110 transition', isDep ? 'bg-gradient-to-l from-emerald-500 to-teal-500 shadow-emerald-500/25' : 'bg-gradient-to-l from-rose-500 to-orange-500 shadow-rose-500/25')}>
          <Check className="w-4 h-4" /> {editing ? 'حفظ التعديل' : isDep ? 'تأكيد الإيداع' : 'تأكيد السحب'}
        </button>
      </div>
    </Modal>
  );
}

