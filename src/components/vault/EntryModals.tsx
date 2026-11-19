import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Plus, AlertTriangle, Pin, Zap, CheckCircle2, Calendar, Trash2, Users, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Modal, Field, inputCls, cx } from './ui';
import { useVault } from './VaultContext';
import { ASSET_KEYS, ASSET_META } from './types';
import type { AssetKey, VaultCashflow } from './types';
import { todayStr, fmt, fmtDate } from './calc';

type EntryType = 'snapshot' | 'deposit' | 'withdrawal';

const getLastDate = (type: EntryType, fallback?: string): string => {
  try {
    const key = `vault_last_${type}_date`;
    return localStorage.getItem(key) || fallback || todayStr();
  } catch {
    return fallback || todayStr();
  }
};

const setLastDate = (type: EntryType, d: string) => {
  try {
    if (d) localStorage.setItem(`vault_last_${type}_date`, d);
  } catch {
    // ignore
  }
};

const ALL_ASSET_ORDER: AssetKey[] = ['stocks', 'cash', 'gold', 'clouds', 'equityFunds', 'fixedIncome'];
const SNAP_FIELDS_STORAGE_KEY = 'egx_vault_snap_fields_v1';

const defaultFieldsForPortfolio = (pid: string): AssetKey[] =>
  pid === 'thndr' ? ['stocks', 'cash', 'gold', 'clouds'] : ['stocks', 'cash'];

const loadVisibleFieldsMap = (): Record<string, AssetKey[]> => {
  try {
    const raw = localStorage.getItem(SNAP_FIELDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
};

const saveVisibleFieldsMap = (map: Record<string, AssetKey[]>) => {
  try {
    localStorage.setItem(SNAP_FIELDS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

const ASSET_BOX_STYLES: Record<AssetKey, { box: string; label: string }> = {
  stocks: {
    box: 'border-emerald-500/25 bg-emerald-500/[0.03]',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  cash: {
    box: 'border-sky-500/35 bg-sky-500/[0.05]',
    label: 'text-sky-600 dark:text-sky-400',
  },
  gold: {
    box: 'border-amber-400/60 bg-gradient-to-br from-amber-400/[0.15] via-yellow-400/[0.08] to-amber-500/[0.04] shadow-xs shadow-amber-500/10',
    label: 'text-amber-600 dark:text-amber-300',
  },
  clouds: {
    box: 'border-violet-500/25 bg-violet-500/[0.03]',
    label: 'text-violet-600 dark:text-violet-400',
  },
  equityFunds: {
    box: 'border-teal-500/25 bg-teal-500/[0.03]',
    label: 'text-teal-600 dark:text-teal-400',
  },
  fixedIncome: {
    box: 'border-orange-500/25 bg-orange-500/[0.03]',
    label: 'text-orange-600 dark:text-orange-400',
  },
};

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
          <span>{p.name}</span>
          {p.pinnedAsset && <Pin className="w-2.5 h-2.5 opacity-80 rotate-45" />}
        </button>
      ))}
    </div>
  );
}

/* ───────── Snapshot (market value) ───────── */
export function SnapshotModal({ open, onClose, initialPortfolio, editDate }: { open: boolean; onClose: () => void; initialPortfolio?: string; editDate?: string }) {
  const { settings, snapshots, saveSnapshot, deleteSnapshot } = useVault();
  const active = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);
  const latestDbSnapDate = useMemo(() => {
    if (!snapshots.length) return undefined;
    return [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  }, [snapshots]);

  const [date, setDate] = useState(() => editDate || getLastDate('snapshot', latestDbSnapDate));
  const [totals, setTotals] = useState<Record<string, string>>({});
  const [portfolioBreakdowns, setPortfolioBreakdowns] = useState<Record<string, Record<string, string>>>({});
  const [visibleFieldsMap, setVisibleFieldsMap] = useState<Record<string, AssetKey[]>>(() => loadVisibleFieldsMap());
  const [customizingPid, setCustomizingPid] = useState<string | null>(null);
  const [totalManuallySet, setTotalManuallySet] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && !editDate) {
      setDate(prev => prev || getLastDate('snapshot', latestDbSnapDate));
    }
  }, [open, editDate, latestDbSnapDate]);

  useEffect(() => {
    if (open && editDate) {
      setDate(editDate);
    }
  }, [open, editDate]);

  const getFieldsFor = (pid: string): AssetKey[] => {
    const saved = visibleFieldsMap[pid];
    const base = saved && saved.length > 0 ? saved : defaultFieldsForPortfolio(pid);
    const curBd = portfolioBreakdowns[pid] || {};
    const extras = ALL_ASSET_ORDER.filter(k => !base.includes(k) && num(curBd[k] ?? '') > 0);
    return ALL_ASSET_ORDER.filter(k => base.includes(k) || extras.includes(k));
  };

  const toggleFieldFor = (pid: string, key: AssetKey) => {
    setVisibleFieldsMap(prev => {
      const current = prev[pid] && prev[pid].length > 0 ? prev[pid] : defaultFieldsForPortfolio(pid);
      let next: AssetKey[];
      if (current.includes(key)) {
        if (current.length <= 1) return prev; // keep at least 1 field
        next = current.filter(k => k !== key);
      } else {
        next = ALL_ASSET_ORDER.filter(k => current.includes(k) || k === key);
      }
      const updated = { ...prev, [pid]: next };
      saveVisibleFieldsMap(updated);
      return updated;
    });
  };

  // Load snapshot data from DB when modal opens or date changes
  useEffect(() => {
    if (!open) return;
    const t: Record<string, string> = {};
    const bds: Record<string, Record<string, string>> = {};

    active.forEach(p => {
      const e = snapshots.find(s => s.portfolioId === p.id && s.date === date);
      if (e) {
        t[p.id] = String(e.total);
        if (e.breakdown && Object.keys(e.breakdown).length > 0) {
          const bdMap: Record<string, string> = {};
          ASSET_KEYS.forEach(k => {
            if (e.breakdown?.[k]) bdMap[k] = String(e.breakdown[k]);
          });
          bds[p.id] = bdMap;
        } else {
          bds[p.id] = { stocks: String(e.total) };
        }
      } else {
        t[p.id] = '';
        bds[p.id] = {};
      }
    });

    setTotals(t);
    setPortfolioBreakdowns(bds);
    setTotalManuallySet({});
    setCustomizingPid(null);
    setSuccessMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const existing = (id: string) => snapshots.find(s => s.portfolioId === id && s.date === date);
  const latest = (id: string) => snapshots.filter(s => s.portfolioId === id).sort((a, b) => b.date.localeCompare(a.date))[0];

  const handleMainTotalChange = (pid: string, val: string) => {
    setTotals(prev => ({ ...prev, [pid]: val }));
    setTotalManuallySet(prev => ({ ...prev, [pid]: true }));
    const tot = num(val);
    const fields = getFieldsFor(pid);
    const primaryKey: AssetKey = fields.includes('stocks') ? 'stocks' : fields[0];
    const curBd = portfolioBreakdowns[pid] || {};

    if (tot <= 0) {
      setPortfolioBreakdowns(prev => ({ ...prev, [pid]: {} }));
      return;
    }

    const otherSum = ASSET_KEYS.reduce((a, k) => (k === primaryKey ? a : a + num(curBd[k] ?? '')), 0);
    if (otherSum > 0 && otherSum <= tot) {
      const rem = Math.max(0, tot - otherSum);
      setPortfolioBreakdowns(prev => ({
        ...prev,
        [pid]: { ...curBd, [primaryKey]: rem > 0 ? String(rem) : '' },
      }));
    } else {
      setPortfolioBreakdowns(prev => ({
        ...prev,
        [pid]: { [primaryKey]: val },
      }));
    }
  };

  const handleAssetFieldChange = (pid: string, field: AssetKey, val: string) => {
    const curBd = portfolioBreakdowns[pid] || {};
    const curTotal = num(totals[pid] ?? '');
    const fields = getFieldsFor(pid);
    const primaryKey: AssetKey = fields.includes('stocks') ? 'stocks' : fields[0];
    const nextBd = { ...curBd, [field]: val };

    // إذا كان الإجمالي محدداً مسبقاً وعدّل المستخدم كاش أو ذهب أو كلاودز: نخصمه من الأصل الأساسي (الأسهم) ليظل الإجمالي ثابتاً
    if (field !== primaryKey && curTotal > 0 && (totalManuallySet[pid] || field === 'cash')) {
      const nonPrimarySum = ASSET_KEYS.reduce((a, k) => (k === primaryKey ? a : a + num(nextBd[k] ?? '')), 0);
      if (nonPrimarySum <= curTotal) {
        const rem = Math.max(0, curTotal - nonPrimarySum);
        nextBd[primaryKey] = rem > 0 ? String(rem) : '';
        setPortfolioBreakdowns(prev => ({ ...prev, [pid]: nextBd }));
        return;
      }
    }

    // وإلا نجمع الأصول تلقائياً لحساب الإجمالي
    setTotalManuallySet(prev => ({ ...prev, [pid]: false }));
    const sum = ASSET_KEYS.reduce((a, k) => a + num(nextBd[k] ?? ''), 0);
    setPortfolioBreakdowns(prev => ({ ...prev, [pid]: nextBd }));
    setTotals(prev => ({ ...prev, [pid]: sum > 0 ? String(sum) : '' }));
  };

  const insertLatestForPortfolio = (pid: string) => {
    const l = latest(pid);
    if (!l) return;
    setTotals(prev => ({ ...prev, [pid]: String(l.total) }));
    if (l.breakdown && Object.keys(l.breakdown).length > 0) {
      const bdMap: Record<string, string> = {};
      ASSET_KEYS.forEach(k => {
        if (l.breakdown?.[k]) bdMap[k] = String(l.breakdown[k]);
      });
      setPortfolioBreakdowns(prev => ({ ...prev, [pid]: bdMap }));
    } else {
      setPortfolioBreakdowns(prev => ({ ...prev, [pid]: { stocks: String(l.total) } }));
    }
  };

  const fillAllLatest = () => {
    const t: Record<string, string> = { ...totals };
    const bds: Record<string, Record<string, string>> = { ...portfolioBreakdowns };
    active.forEach(p => {
      const l = latest(p.id);
      if (l) {
        t[p.id] = String(l.total);
        if (l.breakdown && Object.keys(l.breakdown).length > 0) {
          const bdMap: Record<string, string> = {};
          ASSET_KEYS.forEach(k => {
            if (l.breakdown?.[k]) bdMap[k] = String(l.breakdown[k]);
          });
          bds[p.id] = bdMap;
        } else {
          bds[p.id] = { stocks: String(l.total) };
        }
      }
    });
    setTotals(t);
    setPortfolioBreakdowns(bds);
  };

  const warnings = useMemo(() => {
    const alerts: { name: string; diff: number; pct: number }[] = [];
    active.forEach(p => {
      const val = num(totals[p.id] ?? '');
      const l = latest(p.id);
      if (val > 0 && l && l.total > 0 && l.date !== date) {
        const diff = val - l.total;
        const pct = (diff / l.total) * 100;
        if (pct >= 15 && diff >= 15000) {
          alerts.push({ name: p.name, diff, pct });
        }
      }
    });
    return alerts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals, active, snapshots, date]);

  const submit = async (continueNext = false) => {
    setBusy(true);
    setLastDate('snapshot', date);
    try {
      if (editDate && editDate !== date) {
        for (const p of active) {
          await deleteSnapshot(`${p.id}_${editDate}`);
        }
      }
      for (const p of active) {
        const raw = totals[p.id];
        if (raw === undefined || raw === '') continue;
        const prev = existing(p.id);
        const val = num(raw);

        let bd: Partial<Record<AssetKey, number>> | undefined = undefined;
        const curBd = portfolioBreakdowns[p.id];
        if (curBd && Object.keys(curBd).length > 0) {
          const sumBd = ASSET_KEYS.reduce((a, k) => a + num(curBd[k] ?? ''), 0);
          if (Math.abs(sumBd - val) < 1) {
            bd = {};
            ASSET_KEYS.forEach(k => {
              const v = num(curBd[k] ?? '');
              if (v) bd![k] = v;
            });
          }
        }
        if (!bd && val > 0) {
          bd = { stocks: val };
        }

        await saveSnapshot({
          portfolioId: p.id,
          date,
          total: val,
          breakdown: bd,
          note: prev?.note,
        });
      }

      if (continueNext) {
        setSuccessMsg(`تم حفظ (${fmtDate(date)})`);
      } else {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const grandTotal = useMemo(() => active.reduce((sum, p) => sum + num(totals[p.id] ?? ''), 0), [active, totals]);
  const totalCashEntered = useMemo(() => active.reduce((sum, p) => sum + num(portfolioBreakdowns[p.id]?.cash ?? ''), 0), [active, portfolioBreakdowns]);
  const totalGoldEntered = useMemo(() => active.reduce((sum, p) => sum + num(portfolioBreakdowns[p.id]?.gold ?? ''), 0), [active, portfolioBreakdowns]);
  const canSave = Object.values(totals).some(v => v !== '');

  return (
    <Modal open={open} onClose={onClose} title="تسجيل القيمة السوقية">
      <div className="space-y-3">
        {/* Compact Top Bar: Date + Quick Fill All */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={e => { setDate(e.target.value); setLastDate('snapshot', e.target.value); setSuccessMsg(null); }}
              className={cx(inputCls, '!w-auto !py-1.5 text-xs')}
            />
            <button
              type="button"
              onClick={() => { setDate(todayStr()); setLastDate('snapshot', todayStr()); setSuccessMsg(null); }}
              title="اليوم"
              className={cx(
                'p-2 rounded-xl border transition-all shrink-0',
                date === todayStr()
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-orange-500'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={fillAllLatest}
            className="text-[11px] font-black text-orange-500 hover:text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0"
          >
            <Zap className="w-3 h-3" />
            <span>نسخ آخر القيم</span>
          </button>
        </div>

        {/* Sleek Summary Banner (Total + Cash + Gold) */}
        <div className="rounded-2xl bg-gradient-to-l from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 px-3.5 py-2.5 text-white shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-300">الإجمالي</span>
              {editDate && <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">تعديل</span>}
            </div>
            <div dir="ltr" className="text-xl font-black text-orange-400 tabular-nums">
              {fmt(grandTotal)} <span className="text-[11px] font-bold text-slate-400">ج.م</span>
            </div>
          </div>

          {grandTotal > 0 && (totalCashEntered > 0 || totalGoldEntered > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-white/10 text-[11px] font-black">
              {totalCashEntered > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-400/25 px-2 py-0.5 text-sky-300">
                  <span>💵 الكاش</span>
                  <b dir="ltr" className="tabular-nums text-sky-200">
                    {fmt(totalCashEntered)} ({((totalCashEntered / grandTotal) * 100).toFixed(1)}%)
                  </b>
                </span>
              )}
              {totalGoldEntered > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-l from-amber-500/25 to-yellow-500/15 border border-amber-400/40 px-2 py-0.5 text-amber-300">
                  <span>🪙 الذهب</span>
                  <b dir="ltr" className="tabular-nums text-amber-200">
                    {fmt(totalGoldEntered)} ({((totalGoldEntered / grandTotal) * 100).toFixed(1)}%)
                  </b>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Cards with Inline Per-Portfolio Field Customizer */}
        <div className="space-y-2.5">
          {active.map(p => {
            const l = latest(p.id);
            const curBd = portfolioBreakdowns[p.id] || {};
            const fields = getFieldsFor(p.id);
            const isCustomizing = customizingPid === p.id;
            const totNum = num(totals[p.id] ?? '');
            const gridCols =
              fields.length <= 2
                ? 'grid-cols-2'
                : fields.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4';

            return (
              <div
                key={p.id}
                className={cx(
                  'rounded-2xl border p-2.5 space-y-2 transition-all',
                  initialPortfolio === p.id
                    ? 'border-orange-500/40 bg-orange-500/[0.02]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                )}
              >
                {/* Header Row: Portfolio + Main Total + Insert + Customize */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 w-20 shrink-0">
                    <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{p.name}</span>
                  </div>

                  <input
                    inputMode="decimal"
                    dir="ltr"
                    value={totals[p.id] ?? ''}
                    onChange={e => handleMainTotalChange(p.id, e.target.value)}
                    placeholder={l ? fmt(l.total) : '0'}
                    className={cx(inputCls, '!py-1.5 text-left tabular-nums font-black flex-1')}
                  />

                  {l && (
                    <button
                      type="button"
                      title={`إدراج ${fmt(l.total)}`}
                      onClick={() => insertLatestForPortfolio(p.id)}
                      className="px-2 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition shrink-0"
                    >
                      إدراج
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCustomizingPid(isCustomizing ? null : p.id)}
                    title="تخصيص الأصول الظاهرة"
                    className={cx(
                      'p-1.5 rounded-xl border transition shrink-0',
                      isCustomizing
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {existing(p.id) && (
                    <span title="مسجل" className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>

                {/* Inline Field Customizer Chips (Toggle Visible Assets for This Portfolio) */}
                {isCustomizing && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/70">
                    {ALL_ASSET_ORDER.map(k => {
                      const activeField = fields.includes(k);
                      const meta = ASSET_META[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleFieldFor(p.id, k)}
                          className={cx(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition',
                            activeField
                              ? k === 'gold'
                                ? 'bg-amber-400/20 border-amber-400 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          )}
                        >
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Active Asset Inputs Grid */}
                <div className={cx('grid gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60', gridCols)}>
                  {fields.map(k => {
                    const meta = ASSET_META[k];
                    const st = ASSET_BOX_STYLES[k];
                    const valNum = num(curBd[k] ?? '');
                    const pct = totNum > 0 && valNum > 0 ? Math.round((valNum / totNum) * 100) : 0;

                    return (
                      <div key={k} className={cx('rounded-xl border p-1.5 space-y-0.5', st.box)}>
                        <div className={cx('flex items-center justify-between text-[10px] font-black px-0.5', st.label)}>
                          <span>{meta.emoji} {meta.label}</span>
                          {pct > 0 && <span dir="ltr" className="text-[9px] tabular-nums opacity-85">{pct}%</span>}
                        </div>
                        <input
                          inputMode="decimal"
                          dir="ltr"
                          value={curBd[k] ?? ''}
                          onChange={e => handleAssetFieldChange(p.id, k, e.target.value)}
                          placeholder="0"
                          className={cx(
                            inputCls,
                            '!py-1 !px-2 !text-xs text-left tabular-nums bg-white/90 dark:bg-slate-900/90',
                            k === 'gold' && 'focus:!border-amber-400'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 flex items-start gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1">
              {warnings.map(w => (
                <span key={w.name} className="block">
                  قفزة في <b>{w.name}</b>: <b dir="ltr" className="text-emerald-600 dark:text-emerald-400">+{fmt(w.diff)}</b> (+{w.pct.toFixed(0)}%) — تأكد من تسجيل الإيداع أولاً.
                </span>
              ))}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() => submit(false)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 disabled:opacity-40 hover:brightness-110 transition"
          >
            <Check className="w-4 h-4" /> حفظ وإغلاق
          </button>
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() => submit(true)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-sm font-black shadow-md disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-100 transition"
          >
            <Zap className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            <span>حفظ ومتابعة</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Cashflow ───────── */
export function CashflowModal({ open, onClose, initialType = 'deposit', editing }: { open: boolean; onClose: () => void; initialType?: 'deposit' | 'withdrawal'; editing?: VaultCashflow }) {
  const { settings, cashflows, addCashflow, updateCashflow, deleteCashflow, saveSettings } = useVault();
  const active = settings.portfolios.filter(p => p.active);
  const [type, setType] = useState<'deposit' | 'withdrawal'>(initialType);
  const [pid, setPid] = useState(active[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [party, setParty] = useState<'me' | 'partner'>(editing?.partner ? 'partner' : 'me');

  const getLatestDbDate = (t: 'deposit' | 'withdrawal') => {
    const list = cashflows.filter(c => c.type === t).sort((a, b) => b.date.localeCompare(a.date));
    return list[0]?.date;
  };

  const [date, setDate] = useState(() => {
    if (editing?.date) return editing.date;
    return getLastDate(initialType, getLatestDbDate(initialType));
  });
  const [tag, setTag] = useState('');
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && editing) {
      setType(editing.type);
      setPid(editing.portfolioId);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setTag(editing.tag);
      setParty(editing.partner ? 'partner' : 'me');
      setCustom('');
      setNote(editing.note ?? '');
    } else if (open) {
      setType(initialType);
      setTag('');
      setParty('me');
      setAmount('');
      setNote('');
      setCustom('');
      setDate(getLastDate(initialType, getLatestDbDate(initialType)));
      if (!pid && active[0]) setPid(active[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType, editing?.id]);

  const handleTypeChange = (newType: 'deposit' | 'withdrawal') => {
    setType(newType);
    setTag('');
    if (!editing) {
      setDate(getLastDate(newType, getLatestDbDate(newType)));
    }
  };

  const handleSelectTag = (selectedLabel: string) => {
    setTag(selectedLabel);
    setCustom('');
    if (selectedLabel === 'أرباح الشريك') {
      setParty('partner');
    }
  };

  const tags = settings.tags[type];
  const isDep = type === 'deposit';
  const partnerName = settings.partner?.name || 'الشريك';
  const currentPartnerCap = settings.partner?.partnerCapital ?? 570000;
  const currentMyCap = settings.partner?.myCapital ?? 330000;
  const numAmount = Math.abs(num(amount));
  const isCapChange = (tag === 'زيادة رأس المال') || (tag === 'تخفيض رأس المال');

  const submit = async () => {
    const label = custom.trim() || tag;
    if (!num(amount) || !pid) return;
    setBusy(true);
    try {
      let emoji = tags.find(t => t.label === label)?.emoji ?? '🏷️';
      let nextTags = settings.tags;
      if (custom.trim() && !tags.some(t => t.label === label)) {
        emoji = '🏷️';
        nextTags = { ...settings.tags, [type]: [...tags, { label, emoji }] };
      }
      const finalTag = label || (isDep ? 'إيداع' : 'سحب');
      const isPartner = party === 'partner';

      // إذا كانت الحركة تخص زيادة أو تخفيض رأس المال، نقوم بتحديث رأس المال المرجعي المحفوظ للشريك أو المستخدم
      let nextPartnerSettings = settings.partner;
      if (label === 'زيادة رأس المال') {
        if (isPartner) {
          nextPartnerSettings = { ...settings.partner, partnerCapital: currentPartnerCap + numAmount };
        } else {
          nextPartnerSettings = { ...settings.partner, myCapital: currentMyCap + numAmount };
        }
      } else if (label === 'تخفيض رأس المال') {
        if (isPartner) {
          nextPartnerSettings = { ...settings.partner, partnerCapital: Math.max(0, currentPartnerCap - numAmount) };
        } else {
          nextPartnerSettings = { ...settings.partner, myCapital: Math.max(0, currentMyCap - numAmount) };
        }
      }

      if (nextPartnerSettings !== settings.partner || nextTags !== settings.tags) {
        await saveSettings({
          ...settings,
          tags: nextTags,
          partner: nextPartnerSettings,
        });
      }

      if (editing) {
        await updateCashflow(editing.id, {
          portfolioId: pid,
          type,
          amount: numAmount,
          date,
          tag: finalTag,
          emoji,
          partner: isPartner,
          note: note || '',
        });
      } else {
        await addCashflow({
          portfolioId: pid,
          type,
          amount: numAmount,
          date,
          tag: finalTag,
          emoji,
          partner: isPartner,
          note: note || undefined,
        });
      }
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'تعديل حركة' : 'حركة نقدية'}>
      <div className="space-y-4">
        {/* نوع الحركة: إيداع / سحب */}
        <div className="grid grid-cols-2 gap-2">
          {(['deposit', 'withdrawal'] as const).map(t => (
            <button key={t} type="button" onClick={() => handleTypeChange(t)}
              className={cx('flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-black transition-all',
                type === t ? (t === 'deposit' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400') : 'border-slate-200 dark:border-slate-700 text-slate-400')}>
              {t === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              {t === 'deposit' ? 'إيداع' : 'سحب'}
            </button>
          ))}
        </div>

        {/* عائد الحركة: أنا vs الشريك */}
        <Field label="عائد الحركة النقدية">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setParty('me')}
              className={cx(
                'flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-xs font-black transition-all',
                party === 'me'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              )}
            >
              <span>👤 لي (أنا)</span>
            </button>
            <button
              type="button"
              onClick={() => setParty('partner')}
              className={cx(
                'flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-xs font-black transition-all',
                party === 'partner'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 للشريك ({partnerName})</span>
            </button>
          </div>
        </Field>

        <Field label="المحفظة"><PortfolioPills value={pid} onChange={setPid} /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="المبلغ"><input inputMode="decimal" dir="ltr" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className={cx(inputCls, 'text-left tabular-nums text-lg')} /></Field>
          <Field label="التاريخ">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={e => { setDate(e.target.value); setLastDate(type, e.target.value); }}
                className={cx(inputCls, 'flex-1')}
              />
              <button
                type="button"
                onClick={() => { setDate(todayStr()); setLastDate(type, todayStr()); }}
                title="تعيين تاريخ اليوم"
                className={cx(
                  'p-2.5 rounded-xl border transition-all shrink-0',
                  date === todayStr()
                    ? 'border-orange-500/40 bg-orange-500/10 text-orange-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-orange-500 hover:border-orange-400'
                )}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </Field>
        </div>

        <Field label="التصنيف">
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button key={t.label} type="button" onClick={() => handleSelectTag(t.label)}
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

        {/* تنبيه ذكي عند زيادة أو تخفيض رأس المال */}
        {isCapChange && numAmount > 0 && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-start gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black">
                {tag === 'زيادة رأس المال' ? '🚀 تحديث تلقائي لزيادة رأس المال المسجل:' : '🔻 تحديث تلقائي لتخفيض رأس المال المسجل:'}
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-95">
                سيتم تعديل رأس مال <b className="font-black underline">{party === 'partner' ? partnerName : 'أنا'}</b> المسجل في إعدادات الشراكة من{' '}
                <span dir="ltr" className="font-bold tabular-nums">
                  {fmt(party === 'partner' ? currentPartnerCap : currentMyCap)}
                </span>{' '}
                إلى{' '}
                <span dir="ltr" className="font-black text-amber-900 dark:text-amber-100 tabular-nums">
                  {fmt(
                    tag === 'زيادة رأس المال'
                      ? (party === 'partner' ? currentPartnerCap : currentMyCap) + numAmount
                      : Math.max(0, (party === 'partner' ? currentPartnerCap : currentMyCap) - numAmount)
                  )}
                </span> ج.م
              </p>
            </div>
          </div>
        )}

        <Field label="ملاحظة"><input value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field>

        <div className="flex items-center gap-2 pt-1">
          {editing && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (window.confirm('هل تريد حذف هذه الحركة بالتأكيد؟')) {
                  setBusy(true);
                  try {
                    await deleteCashflow(editing.id);
                    onClose();
                  } finally {
                    setBusy(false);
                  }
                }
              }}
              className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}
          <button disabled={!num(amount) || busy} onClick={submit}
            className={cx('flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white shadow-lg disabled:opacity-40 hover:brightness-110 transition', isDep ? 'bg-gradient-to-l from-emerald-500 to-teal-500 shadow-emerald-500/25' : 'bg-gradient-to-l from-rose-500 to-orange-500 shadow-rose-500/25')}>
            <Check className="w-4 h-4" /> {editing ? 'حفظ التعديل' : isDep ? 'تأكيد الإيداع' : 'تأكيد السحب'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

