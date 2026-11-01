import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Plus, AlertTriangle, Pin, Zap, CheckCircle2, Calendar } from 'lucide-react';
import { Modal, Field, inputCls, Segmented, cx } from './ui';
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

const DETAIL_GRID_KEYS: AssetKey[] = ['stocks', 'cash', 'clouds', 'fixedIncome', 'equityFunds', 'gold'];

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
  const { settings, snapshots, saveSnapshot, deleteSnapshot, saveSettings } = useVault();
  const active = settings.portfolios.filter(p => p.active);
  const [mode, setMode] = useState<'quick' | 'detail'>('quick');
  const latestDbSnapDate = useMemo(() => {
    if (!snapshots.length) return undefined;
    return [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  }, [snapshots]);

  const [date, setDate] = useState(() => editDate || getLastDate('snapshot', latestDbSnapDate));

  useEffect(() => {
    if (open && !editDate) {
      setDate(prev => prev || getLastDate('snapshot', latestDbSnapDate));
    }
  }, [open, editDate, latestDbSnapDate]);
  const [pid, setPid] = useState(initialPortfolio ?? active[0]?.id ?? '');
  const [totals, setTotals] = useState<Record<string, string>>({});
  const [portfolioBreakdowns, setPortfolioBreakdowns] = useState<Record<string, Record<string, string>>>({});
  const [quickAsset, setQuickAsset] = useState<Record<string, AssetKey>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [totalManuallySet, setTotalManuallySet] = useState<boolean>(false);

  useEffect(() => {
    if (open && initialPortfolio) setPid(initialPortfolio);
  }, [open, initialPortfolio]);

  useEffect(() => {
    if (!open) return;
    if (editDate) {
      setDate(editDate);
      const e = snapshots.find(s => s.portfolioId === (initialPortfolio ?? pid) && s.date === editDate);
      setMode(e?.breakdown && Object.keys(e.breakdown).length ? 'detail' : 'quick');
    }
  }, [open, editDate, initialPortfolio, pid, snapshots]);

  // Load snapshot data from DB only when modal opens or date changes
  useEffect(() => {
    if (!open) return;
    const t: Record<string, string> = {};
    const bds: Record<string, Record<string, string>> = {};
    const qAssets: Record<string, AssetKey> = {};

    active.forEach(p => {
      const e = snapshots.find(s => s.portfolioId === p.id && s.date === date);
      // Immediately preceding snapshot on or before this date:
      const prev = snapshots
        .filter(s => s.portfolioId === p.id && s.date < date)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
        || latest(p.id);

      if (e) {
        t[p.id] = String(e.total);
        if (e.breakdown && Object.keys(e.breakdown).length > 0) {
          const bdMap: Record<string, string> = {};
          ASSET_KEYS.forEach(k => {
            if (e.breakdown?.[k]) bdMap[k] = String(e.breakdown[k]);
          });
          bds[p.id] = bdMap;
          const presentKeys = Object.keys(bdMap);
          if (presentKeys.length === 1) {
            qAssets[p.id] = presentKeys[0] as AssetKey;
          }
        }
      } else if (prev) {
        // Pre-fill default values from the immediately preceding recorded snapshot!
        t[p.id] = String(prev.total);
        if (prev.breakdown && Object.keys(prev.breakdown).length > 0) {
          const bdMap: Record<string, string> = {};
          ASSET_KEYS.forEach(k => {
            if (prev.breakdown?.[k]) bdMap[k] = String(prev.breakdown[k]);
          });
          bds[p.id] = bdMap;
          const presentKeys = Object.keys(bdMap);
          if (presentKeys.length === 1) {
            qAssets[p.id] = presentKeys[0] as AssetKey;
          }
        } else {
          const chosen = p.pinnedAsset ?? (p.id === 'thndr' ? 'stocks' : 'stocks');
          bds[p.id] = { [chosen]: String(prev.total) };
          qAssets[p.id] = chosen;
        }
      }

      if (!qAssets[p.id]) {
        qAssets[p.id] = p.pinnedAsset ?? (p.id === 'thndr' ? 'stocks' : 'stocks');
      }
    });

    setTotals(t);
    setPortfolioBreakdowns(bds);
    setQuickAsset(qAssets);
    const curSnap = snapshots.find(s => s.portfolioId === pid && s.date === date);
    setNote(curSnap?.note ?? '');
    setSuccessMsg(null);
  }, [open, date]);

  const existing = (id: string) => snapshots.find(s => s.portfolioId === id && s.date === date);
  const latest = (id: string) => snapshots.filter(s => s.portfolioId === id).sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestWithBreakdown = (id: string) => snapshots.filter(s => s.portfolioId === id && s.breakdown && Object.keys(s.breakdown).length > 0 && s.date !== date).sort((a, b) => b.date.localeCompare(a.date))[0];

  const togglePinAsset = async (targetPid: string, assetKey: AssetKey) => {
    const pObj = settings.portfolios.find(p => p.id === targetPid);
    if (!pObj) return;
    const newPinned = pObj.pinnedAsset === assetKey ? undefined : assetKey;
    const newPortfolios = settings.portfolios.map(p =>
      p.id === targetPid ? { ...p, pinnedAsset: newPinned } : p
    );
    await saveSettings({ ...settings, portfolios: newPortfolios });

    if (newPinned) {
      setQuickAsset(prev => ({ ...prev, [targetPid]: newPinned }));
      const curVal = totals[targetPid] ? num(totals[targetPid]) : (latest(targetPid)?.total || 0);
      if (curVal > 0) {
        setPortfolioBreakdowns(prev => ({
          ...prev,
          [targetPid]: { [assetKey]: String(curVal) },
        }));
        setTotals(prev => ({ ...prev, [targetPid]: String(curVal) }));
      }
    }
  };

  const prevBreakdown = latestWithBreakdown(pid);
  const copyPrevBreakdown = () => {
    if (!prevBreakdown?.breakdown) return;
    const next: Record<string, string> = {};
    ASSET_KEYS.forEach(k => {
      if (prevBreakdown.breakdown?.[k]) next[k] = String(prevBreakdown.breakdown[k]);
    });
    const sum = ASSET_KEYS.reduce((a, k) => a + num(next[k] ?? ''), 0);
    setPortfolioBreakdowns(prev => ({ ...prev, [pid]: next }));
    if (sum > 0) {
      setTotals(prev => ({ ...prev, [pid]: String(sum) }));
    }
  };

  // Current parts for selected portfolio in detail mode
  const currentParts = portfolioBreakdowns[pid] || {};
  const detailSum = useMemo(() => ASSET_KEYS.reduce((a, k) => a + num(currentParts[k] ?? ''), 0), [currentParts]);

  // When editing in Detail mode: update breakdowns for pid and sync total
  const handleDetailAssetChange = (key: AssetKey, val: string) => {
    const nextParts = { ...currentParts, [key]: val };
    const sum = ASSET_KEYS.reduce((a, k) => a + num(nextParts[k] ?? ''), 0);
    setPortfolioBreakdowns(prev => ({ ...prev, [pid]: nextParts }));
    setTotals(prev => ({ ...prev, [pid]: sum > 0 ? String(sum) : '' }));
  };

  // When clicking "كل المحفظة" inside Detail mode for an asset
  const handleAssignAllToAssetInDetail = (key: AssetKey) => {
    const curVal = totals[pid] ? num(totals[pid]) : (latest(pid)?.total || 0);
    if (curVal > 0) {
      const nextParts: Record<string, string> = { [key]: String(curVal) };
      setPortfolioBreakdowns(prev => ({ ...prev, [pid]: nextParts }));
      setTotals(prev => ({ ...prev, [pid]: String(curVal) }));
    }
  };

  // When typing total in Quick mode ("كل المحافظ")
  const handleQuickTotalChange = (portfolioId: string, val: string) => {
    setTotals(prev => ({ ...prev, [portfolioId]: val }));
    const nVal = num(val);
    const chosenTag = quickAsset[portfolioId] || settings.portfolios.find(p => p.id === portfolioId)?.pinnedAsset || 'stocks';
    const curBd = portfolioBreakdowns[portfolioId];
    const isMultiAsset = curBd && Object.values(curBd).filter(v => num(v) > 0).length > 1;
    // Only auto-allocate if not a custom multi-asset split
    if (!isMultiAsset) {
      if (nVal > 0) {
        setPortfolioBreakdowns(prev => ({ ...prev, [portfolioId]: { [chosenTag]: val } }));
      } else {
        setPortfolioBreakdowns(prev => ({ ...prev, [portfolioId]: {} }));
      }
    }
  };

  // Specialized handlers for Thndr's 3 smart sub-boxes (stocks - clouds - equityFunds)
  const handleThndrMainTotalChange = (val: string) => {
    setTotals(prev => ({ ...prev, thndr: val }));
    setTotalManuallySet(true);
    const tot = num(val);
    const curBd = portfolioBreakdowns['thndr'] || {};
    const cloudsVal = num(curBd.clouds ?? '');
    const fundsVal = num(curBd.equityFunds ?? '');

    if (tot <= 0) {
      setPortfolioBreakdowns(prev => ({
        ...prev,
        thndr: { stocks: '', clouds: '', equityFunds: '' },
      }));
      return;
    }

    // إذا كانت هناك أصول فرعية مسجلة: تُحسب الأسهم كباقي الإجمالي تلقائياً
    if (cloudsVal > 0 || fundsVal > 0) {
      const remainingStocks = Math.max(0, tot - cloudsVal - fundsVal);
      setPortfolioBreakdowns(prev => ({
        ...prev,
        thndr: {
          ...curBd,
          stocks: remainingStocks > 0 ? String(remainingStocks) : '',
        },
      }));
    } else {
      setPortfolioBreakdowns(prev => ({
        ...prev,
        thndr: { stocks: val, clouds: '', equityFunds: '' },
      }));
    }
  };

  const handleThndrSubChange = (field: 'stocks' | 'clouds' | 'equityFunds', subVal: string) => {
    const curBd = portfolioBreakdowns['thndr'] || {};
    const curTotal = num(totals['thndr'] ?? '');
    const curFunds = num(curBd.equityFunds ?? '');
    const subNum = num(subVal);

    const newBd = { ...curBd, [field]: subVal };

    // إذا كتب المستخدم الإجمالي أولاً (مثلاً 100 ألف) ثم أدخل الكلاودز أو الأسهم:
    if (totalManuallySet && curTotal > 0 && subNum > 0 && subNum < curTotal) {
      if (field === 'clouds') {
        const remainingStocks = Math.max(0, curTotal - subNum - curFunds);
        newBd.stocks = remainingStocks > 0 ? String(remainingStocks) : '';
        setPortfolioBreakdowns(prev => ({ ...prev, thndr: newBd }));
        setTotalManuallySet(false);
        return;
      } else if (field === 'stocks') {
        const remainingClouds = Math.max(0, curTotal - subNum - curFunds);
        newBd.clouds = remainingClouds > 0 ? String(remainingClouds) : '';
        setPortfolioBreakdowns(prev => ({ ...prev, thndr: newBd }));
        setTotalManuallySet(false);
        return;
      }
    }

    setTotalManuallySet(false);

    // الجمع التلقائي المباشر: الإجمالي = الأسهم + الكلاودز + الصناديق
    const s = num(newBd.stocks ?? '');
    const c = num(newBd.clouds ?? '');
    const f = num(newBd.equityFunds ?? '');
    const sum = s + c + f;

    setPortfolioBreakdowns(prev => ({
      ...prev,
      thndr: newBd,
    }));

    setTotals(prev => ({
      ...prev,
      thndr: sum > 0 ? String(sum) : (subVal ? subVal : ''),
    }));
  };

  // When clicking a quick asset tag under a portfolio in Quick mode
  const handleQuickTagClick = (portfolioId: string, assetKey: AssetKey) => {
    setQuickAsset(prev => ({ ...prev, [portfolioId]: assetKey }));
    const curTot = totals[portfolioId];
    if (curTot && num(curTot) > 0) {
      setPortfolioBreakdowns(prev => ({
        ...prev,
        [portfolioId]: { [assetKey]: curTot },
      }));
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
          const chosen = quickAsset[p.id] || p.pinnedAsset || 'stocks';
          bds[p.id] = { [chosen]: String(l.total) };
        }
      }
    });
    setTotals(t);
    setPortfolioBreakdowns(bds);
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
  }, [mode, totals, detailSum, pid, active, latest, date]);

  const submit = async (continueNext = false) => {
    setBusy(true);
    setLastDate('snapshot', date);
    try {
      if (editDate && editDate !== date) {
        for (const p of active) {
          await deleteSnapshot(`${p.id}_${editDate}`);
        }
      }
      if (mode === 'quick') {
        for (const p of active) {
          const raw = totals[p.id];
          if (raw === undefined || raw === '') continue;
          const prev = existing(p.id);
          const val = num(raw);
          const pObj = settings.portfolios.find(x => x.id === p.id);

          let bd: Partial<Record<AssetKey, number>> | undefined = undefined;
          const curBd = portfolioBreakdowns[p.id];
          if (curBd && Object.keys(curBd).length > 0) {
            const sumBd = ASSET_KEYS.reduce((a, k) => a + num(curBd[k] ?? ''), 0);
            if (sumBd === val) {
              bd = {};
              ASSET_KEYS.forEach(k => {
                const v = num(curBd[k] ?? '');
                if (v) bd![k] = v;
              });
            }
          }
          if (!bd && val > 0) {
            const chosenTag = quickAsset[p.id] || pObj?.pinnedAsset || 'stocks';
            bd = { [chosenTag]: val };
          }

          await saveSnapshot({
            portfolioId: p.id,
            date,
            total: val,
            breakdown: bd,
            note: note || prev?.note,
          });
        }
      } else {
        const curBd = portfolioBreakdowns[pid] || {};
        const sum = ASSET_KEYS.reduce((a, k) => a + num(curBd[k] ?? ''), 0);
        const bd: Partial<Record<AssetKey, number>> = {};
        ASSET_KEYS.forEach(k => {
          const v = num(curBd[k] ?? '');
          if (v) bd[k] = v;
        });
        await saveSnapshot({
          portfolioId: pid,
          date,
          total: sum,
          breakdown: bd,
          note: note || undefined,
        });
      }

      if (continueNext) {
        setSuccessMsg(`تم حفظ تسجيل يوم (${fmtDate(date)}) بنجاح! يمكنك تغيير التاريخ وإدخال قراءة جديدة فوراً.`);
      } else {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const grandTotal = useMemo(() => {
    return active.reduce((sum, p) => sum + num(totals[p.id] ?? ''), 0);
  }, [active, totals]);

  const canSave = mode === 'quick' ? Object.values(totals).some(v => v !== '') : detailSum > 0;

  return (
    <Modal open={open} onClose={onClose} title="تسجيل القيمة السوقية">
      <div className="space-y-3.5">
        {/* Top Controls: Mode Switcher + Date Picker */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <Segmented size="sm" value={mode} onChange={setMode} options={[{ v: 'quick', label: 'كل المحافظ' }, { v: 'detail', label: 'تفصيلي بالأصول' }]} />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={e => { setDate(e.target.value); setLastDate('snapshot', e.target.value); setSuccessMsg(null); }}
              className={cx(inputCls, '!w-auto !py-1.5 text-xs')}
              title={editDate ? "يمكنك تعديل التاريخ وسينتقل التسجيل تلقائياً للتاريخ الجديد" : undefined}
            />
            <button
              type="button"
              onClick={() => { setDate(todayStr()); setLastDate('snapshot', todayStr()); setSuccessMsg(null); }}
              title="تعيين تاريخ اليوم"
              className={cx(
                'p-2 rounded-xl border transition-all shrink-0',
                date === todayStr()
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-orange-500 hover:border-orange-400'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dedicated Full-Width Grand Total Review Bar (Never clipped, prominent & clean) */}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 px-4 py-2.5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">إجمالي القيمة السوقية لكل المحافظ:</span>
            {editDate && <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">وضع التعديل</span>}
          </div>
          <div dir="ltr" className="text-xl font-black text-orange-400 tabular-nums">
            {fmt(grandTotal)} <span className="text-xs font-bold text-slate-400">ج.م</span>
          </div>
        </div>

        {mode === 'quick' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400">قيم المحافظ:</span>
              <button
                type="button"
                onClick={fillAllLatest}
                className="text-[11px] font-black text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
              >
                <span>نسخ آخر القيم للكل</span>
                <span className="text-xs">⚡</span>
              </button>
            </div>
            {active.map(p => {
              const l = latest(p.id);
              const curBd = portfolioBreakdowns[p.id];
              const bdEntries = curBd ? Object.entries(curBd).filter(([_, v]) => num(v) > 0) : [];
              const isMulti = bdEntries.length > 1;
              const activeTag = isMulti ? null : (bdEntries.length === 1 ? (bdEntries[0][0] as AssetKey) : (quickAsset[p.id] || p.pinnedAsset || (p.id === 'thndr' ? 'stocks' : 'stocks')));

              return (
                <div key={p.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <i className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                    <div className="w-20 text-sm font-black text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                    <input
                      inputMode="decimal" dir="ltr"
                      value={totals[p.id] ?? ''}
                      onChange={e => p.id === 'thndr' ? handleThndrMainTotalChange(e.target.value) : handleQuickTotalChange(p.id, e.target.value)}
                      placeholder={l ? `آخر قيمة ${fmt(l.total)}` : '0'}
                      className={cx(inputCls, 'text-left tabular-nums flex-1')}
                    />
                    {l && (
                      <button
                        type="button"
                        title={`إدراج آخر قيمة (${fmt(l.total)})`}
                        onClick={() => p.id === 'thndr' ? handleThndrMainTotalChange(String(l.total)) : handleQuickTotalChange(p.id, String(l.total))}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-all shrink-0"
                      >
                        إدراج
                      </button>
                    )}
                    {existing(p.id) && <span className="text-[10px] font-black text-amber-500 shrink-0">مسجل</span>}
                  </div>

                  {p.id === 'thndr' ? (
                    /* 3 Compact Smart Sub-boxes for Thndr */
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                      {/* 1. الأسهم */}
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] p-1.5 space-y-0.5">
                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          📈 أسهم
                        </div>
                        <input
                          inputMode="decimal"
                          dir="ltr"
                          value={curBd?.stocks ?? ''}
                          onChange={e => handleThndrSubChange('stocks', e.target.value)}
                          placeholder="0"
                          className={cx(inputCls, '!py-1 !text-xs text-left tabular-nums bg-white dark:bg-slate-900')}
                        />
                      </div>

                      {/* 2. الكلاودز */}
                      <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.03] p-1.5 space-y-0.5">
                        <div className="text-[10px] font-black text-violet-600 dark:text-violet-400">
                          ☁️ كلاودز
                        </div>
                        <input
                          inputMode="decimal"
                          dir="ltr"
                          value={curBd?.clouds ?? ''}
                          onChange={e => handleThndrSubChange('clouds', e.target.value)}
                          placeholder="0"
                          className={cx(inputCls, '!py-1 !text-xs text-left tabular-nums bg-white dark:bg-slate-900')}
                        />
                      </div>

                      {/* 3. صناديق الاستثمار */}
                      <div className="rounded-xl border border-teal-500/25 bg-teal-500/[0.03] p-1.5 space-y-0.5">
                        <div className="text-[10px] font-black text-teal-600 dark:text-teal-400">
                          🧺 صناديق
                        </div>
                        <input
                          inputMode="decimal"
                          dir="ltr"
                          value={curBd?.equityFunds ?? ''}
                          onChange={e => handleThndrSubChange('equityFunds', e.target.value)}
                          placeholder="0"
                          className={cx(inputCls, '!py-1 !text-xs text-left tabular-nums bg-white dark:bg-slate-900')}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Quick asset allocation tags for other portfolios */
                    <div className="flex items-center gap-1.5 pt-1 pr-5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">تخصيص سريع:</span>
                      {isMulti && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                          موزع تفصيلياً (تفصيلي بالأصول)
                        </span>
                      )}
                      {(() => {
                        const isExpanded = !!expandedTags[p.id];
                        const primaryKeys: AssetKey[] = ['stocks', 'clouds'];
                        const secondaryKeys: AssetKey[] = ['fixedIncome', 'gold', 'cash'];
                        const visibleKeys = isExpanded
                          ? [...primaryKeys, ...secondaryKeys]
                          : (activeTag && secondaryKeys.includes(activeTag) ? [...primaryKeys, activeTag] : primaryKeys);

                        return (
                          <>
                            {visibleKeys.map(k => {
                              const meta = ASSET_META[k];
                              const isSelected = activeTag === k;
                              return (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => handleQuickTagClick(p.id, k)}
                                  className={cx(
                                    'text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 shrink-0',
                                    isSelected
                                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs scale-[1.03]'
                                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                  )}
                                >
                                  <span>{meta.emoji}</span>
                                  <span>{meta.label}</span>
                                  {isSelected && <span className="text-[9px] opacity-75">100%</span>}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => setExpandedTags(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded-lg transition shrink-0"
                            >
                              {isExpanded ? 'إخفاء ▴' : '+ المزيد'}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
            
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

            {prevBreakdown && (!currentParts || Object.values(currentParts).every(v => !v || v === '0')) && (
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
              {DETAIL_GRID_KEYS.map(k => {
                const curVal = totals[pid] ? num(totals[pid]) : 0;
                const currentP = active.find(p => p.id === pid);
                const isPinned = currentP?.pinnedAsset === k;
                return (
                  <div
                    key={k}
                    className={cx(
                      'rounded-2xl border p-3 transition-all',
                      isPinned
                        ? 'border-amber-500/60 bg-amber-500/[0.04] shadow-sm ring-2 ring-amber-500/20'
                        : 'border-slate-100 dark:border-slate-800'
                    )}
                    style={{ borderTopColor: ASSET_META[k].color, borderTopWidth: 3 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                        {ASSET_META[k].emoji} {ASSET_META[k].label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePinAsset(pid, k)}
                          title={isPinned ? 'إلغاء التثبيت التلقائي' : `تثبيت محفظة ${currentP?.name ?? ''} في ${ASSET_META[k].label} (100% تلقائي كل مرة)`}
                          className={cx(
                            'flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-lg transition-all',
                            isPinned
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <Pin className={cx('w-3 h-3', isPinned && 'fill-white rotate-45')} />
                          {isPinned && <span className="text-[9px]">مثبت</span>}
                        </button>

                        {curVal > 0 && (
                          <button
                            type="button"
                            title="إدراج كل قيمة المحفظة بالكامل في هذا الحقل"
                            onClick={() => handleAssignAllToAssetInDetail(k)}
                            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-500 transition-all"
                          >
                            كل المحفظة
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      inputMode="decimal" dir="ltr"
                      value={currentParts[k] ?? ''}
                      onChange={e => handleDetailAssetChange(k, e.target.value)}
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
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1 text-[11px] font-bold leading-normal">
              {warnings.map(w => (
                <span key={w.name} className="block">
                  قفزة في <b>{w.name}</b> بمقدار <b dir="ltr" className="text-emerald-600 dark:text-emerald-400">+{fmt(w.diff)} ج.م</b> (+{w.pct.toFixed(0)}%). تأكد من تسجيل أي إيداع نقدي جديد أولاً.
                </span>
              ))}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">✕</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() => submit(false)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 disabled:opacity-40 hover:brightness-110 transition"
          >
            <Check className="w-4 h-4" /> حفظ وإغلاق
          </button>
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() => submit(true)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-slate-200 py-3 text-sm font-black shadow-md disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-100 transition"
          >
            <Zap className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            <span>حفظ ومتابعة الإدخال ⚡</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Cashflow ───────── */
export function CashflowModal({ open, onClose, initialType = 'deposit', editing }: { open: boolean; onClose: () => void; initialType?: 'deposit' | 'withdrawal'; editing?: VaultCashflow }) {
  const { settings, cashflows, addCashflow, updateCashflow, saveSettings } = useVault();
  const [isPartner, setIsPartner] = useState(false);
  const active = settings.portfolios.filter(p => p.active);
  const [type, setType] = useState<'deposit' | 'withdrawal'>(initialType);
  const [pid, setPid] = useState(active[0]?.id ?? '');
  const [amount, setAmount] = useState('');

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
      setCustom('');
      setNote(editing.note ?? '');
      setIsPartner(!!editing.partner);
    } else if (open) {
      setType(initialType);
      setTag('');
      setAmount('');
      setNote('');
      setCustom('');
      setDate(getLastDate(initialType, getLatestDbDate(initialType)));
      setIsPartner(false);
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
            <button key={t} type="button" onClick={() => handleTypeChange(t)}
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

