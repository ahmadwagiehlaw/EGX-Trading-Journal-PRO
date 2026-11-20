import React from 'react';
import ConfirmModal from './ConfirmModal';
import { useState, useMemo, useEffect } from 'react';
import { Plus, ArrowDownLeft, X, AlertCircle } from 'lucide-react';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import type { Transaction } from '../utils/calculations';
import { computePositionMetrics, simulatePositionMetrics, formatEGP } from '../utils/calculations';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: TickerPosition | null;
  defaultType?: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';
  defaultShares?: string;
  defaultPrice?: string;
  defaultNote?: string;
  transactionToEdit?: Transaction | null;
  linkedBuyId?: string;
  inline?: boolean;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  position,
  defaultType = 'buy',
  defaultShares = '',
  defaultPrice = '',
  defaultNote = '',
  transactionToEdit = null,
  linkedBuyId = '',
  inline = false
}: TransactionFormModalProps) {
  const { 
    addTransaction, 
    updateTransaction, 
    updatePosition,
    capitalInvestment, 
    capitalSpeculation, 
    fixedIncome,
    totalOpenCapitalInvestment, 
    totalOpenCapitalSpeculation 
  } = useTrades();

  const [type, setType] = useState<'buy' | 'sell' | 'dividend' | 'split' | 'bonus'>(defaultType);
  const [priceStr, setPriceStr] = useState(defaultPrice);
  const [sharesStr, setSharesStr] = useState(defaultShares);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(defaultNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);
  const [raiseStopToBreakeven, setRaiseStopToBreakeven] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const [portfolioType, setPortfolioType] = useState<'investment' | 'speculation'>(
    transactionToEdit?.portfolioType || position?.portfolioType || 'investment'
  );

  const [entryReason, setEntryReason] = useState('support');
  const [customEntryReason, setCustomEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('target');
  const [emotion, setEmotion] = useState<'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral'>('neutral');
  const [checklist, setChecklist] = useState({ majorSR: false, bos: false, retest: false });
  const [isRuleBreaker, setIsRuleBreaker] = useState(false);
  const [executionRating, setExecutionRating] = useState<number>(0);
  const [showExtraJournal, setShowExtraJournal] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setPriceStr(transactionToEdit.price.toString());
      setSharesStr(transactionToEdit.shares.toString());
      setDateStr(new Date(transactionToEdit.date).toISOString().slice(0, 10));
      setNote(transactionToEdit.note || '');
      
      if (transactionToEdit.type === 'buy') {
        const er = transactionToEdit.entryReason || 'support';
        if (['support', 'breakout', 'indicator', 'fomo', 'tip', 'avg_down'].includes(er)) {
          setEntryReason(er);
        } else {
          setEntryReason('other');
          setCustomEntryReason(er);
        }
        setChecklist(transactionToEdit.checklist || { majorSR: false, bos: false, retest: false });
      } else {
        setExitReason(transactionToEdit.exitReason || 'target');
      }
      setIsRuleBreaker(transactionToEdit.isRuleBreaker || false);
      setExecutionRating(transactionToEdit.executionRating || 0);
      if (transactionToEdit.emotion) setEmotion(transactionToEdit.emotion);
      if (transactionToEdit.portfolioType) setPortfolioType(transactionToEdit.portfolioType);
    } else {
      setType(defaultType);
      setSharesStr(defaultShares);
      setPriceStr(position?.currentMarketPrice ? position.currentMarketPrice.toString() : '');
    }
  }, [transactionToEdit, defaultType, defaultShares, position]);

  const currentMetrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position, 0.003); // Assuming default 0.3% commission for display limits
  }, [position]);

  // معاينة البيع الفورية حسب قاعدة الأقل سعراً يُباع أولاً (Pre-Sell Simulator)
  const sellPreview = useMemo(() => {
    if (!position || !currentMetrics || type !== 'sell' || transactionToEdit) return null;
    const s = parseInt(sharesStr);
    const p = parseFloat(priceStr);
    if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(p) || p <= 0 || s > currentMetrics.openShares) return null;

    const previewTx: Transaction = {
      id: '__preview_sell__',
      type: 'sell',
      date: new Date(dateStr).getTime() || Date.now(),
      price: p,
      shares: s,
      amount: s * p,
      portfolioType,
    };
    const afterSim = simulatePositionMetrics([...(position.transactions || []), previewTx], 0.003, position.symbol);
    const ev = afterSim.realizedEvents.find(e => e.txId === '__preview_sell__');
    const netPnL = ev?.netPnL ?? 0;
    const matchedLots = ev?.lotsClosed ?? [];
    const costClosed = matchedLots.reduce((a, l) => a + l.buyPrice * l.shares, 0);
    const pnlPct = costClosed > 0 ? (netPnL / costClosed) * 100 : 0;
    const newBreakEven = afterSim.openShares > 0
      ? Math.max(0, (afterSim.totalCost - afterSim.totalNetRealizedPnL) / afterSim.openShares)
      : 0;

    return {
      netPnL,
      pnlPct,
      matchedLots,
      remainingShares: afterSim.openShares,
      newAvgEntry: afterSim.avgEntry,
      newBreakEven,
    };
  }, [position, currentMetrics, type, transactionToEdit, sharesStr, priceStr, dateStr, portfolioType]);

  if (!isOpen && !inline) return null;
  if (!position || !currentMetrics) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(priceStr);
    const shares = parseInt(sharesStr);
    const amount = price * shares;

    if (isNaN(price) || price <= 0) {
      setError('يرجى إدخال سعر صحيح أكبر من الصفر.');
      return;
    }

    if (isNaN(shares) || shares <= 0) {
      setError('يرجى إدخال عدد أسهم صحيح أكبر من الصفر.');
      return;
    }

    if (type === 'buy') {
      const availablePower = portfolioType === 'investment' 
        ? Math.max(0, capitalInvestment - totalOpenCapitalInvestment - (fixedIncome || 0))
        : Math.max(0, capitalSpeculation - totalOpenCapitalSpeculation);
      
      if (amount > availablePower && !transactionToEdit) {
        if (!window.confirm(`تحذير: سيولة الـ ${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (${formatEGP(amount)}). هل أنت متأكد من الاستمرار (سيتم تجاوز السقف)؟`)) {
          return;
        }
      }
    }

    if (type === 'sell' && !transactionToEdit) {
      if (shares > currentMetrics.openShares) {
        setError(`لا يمكن بيع كمية (${shares}) أكبر من الكمية المفتوحة المتبقية (${currentMetrics.openShares} سهم).`);
        return;
      }

      // Core Allocation Shield Protection
      const coreShares = position?.coreShares || 0;
      if (coreShares > 0) {
        const freeSwingShares = Math.max(0, currentMetrics.openShares - coreShares);
        if (shares > freeSwingShares) {
          const coreCut = shares - freeSwingShares;
          if (!window.confirm(`🛡️ تنبيه درع الكور (Core Shield):
أنت على وشك بيع ${shares} سهم، مما سيقتطع (${coreCut} سهم) من أسهم الكور المخصصة للاستثمار طويل الأجل (${coreShares} سهم).
المتاح للبيع الحر من أسهم المضاربة هو (${freeSwingShares} سهم) فقط.

هل أنت متأكد من تنفيذ هذا البيع الاستراتيجي من أسهم الكور؟`)) {
            return;
          }
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      const finalEntryReason = entryReason === 'other' ? customEntryReason.trim() || 'سبب آخر' : entryReason;

      const rawPayload = {
        type,
        date: new Date(dateStr).getTime(),
        price,
        shares,
        amount,
        note: note.trim(),
        linkedBuyId: linkedBuyId || transactionToEdit?.linkedBuyId || null,
        ...(type === 'buy' && { 
          portfolioType, 
          entryReason: finalEntryReason, 
          checklist, 
          emotion, 
          isRuleBreaker, 
          executionRating 
        }),
        ...(type === 'sell' && { 
          exitReason, 
          emotion, 
          mistake: '', 
          isRuleBreaker, 
          executionRating 
        })
      };

      // Safely strip ALL undefined fields to prevent Firebase crash
      const txPayload = JSON.parse(JSON.stringify(rawPayload));

      if (transactionToEdit) {
        await updateTransaction(position.id, transactionToEdit.id, txPayload);
      } else {
        await addTransaction(position.id, txPayload);
        
        // If selling and user checked raiseStopToBreakeven, ratchet stop to breakeven
        if (type === 'sell' && raiseStopToBreakeven && currentMetrics.avgEntry > currentMetrics.currentStop) {
          const beStop = currentMetrics.avgEntry;
          await updatePosition(position.id, {
            trailingStop: {
              initial: position.trailingStop?.initial || position.plan?.stop || beStop,
              current: beStop,
              highestReached: Math.max(position.trailingStop?.highestReached || 0, price),
              atrAtEntry: position.trailingStop?.atrAtEntry || position.plan?.atr || 0,
              ...(position.trailingStop?.atrMultiplier ? { atrMultiplier: position.trailingStop.atrMultiplier } : {})
            },
            currentStopLoss: beStop,
          } as any);
        }
      }

      setIsSubmitting(false);
      if (!inline) setPendingSaveData(null);
    onClose();
      
      if (inline) {
        setPriceStr('');
        setSharesStr('');
        setNote('');
        setExecutionRating(0);
        setCustomEntryReason('');
        setRaiseStopToBreakeven(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'حدث خطأ أثناء حفظ المعاملة.');
    }
  };

  const content = (
    <div className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl ${!inline ? 'shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800' : 'h-full flex-1'} overflow-hidden flex flex-col`}>
      <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${inline ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/70'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
            {position.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-slate-900 dark:text-white" dir="ltr">{position.symbol}</h3>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                {currentMetrics.openShares} سهم مفتوح
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-bold mt-0.5">
              متوسط الدخول الحالي: {currentMetrics.avgEntry.toFixed(2)} EGP
            </p>
          </div>
        </div>

        {!inline && (
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
        <div className="grid grid-cols-4 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
          <button type="button" onClick={() => { setType('buy'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'buy' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            <Plus className="w-3.5 h-3.5" /> شراء إضافي
          </button>
          <button type="button" onClick={() => { setType('sell'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'sell' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            <ArrowDownLeft className="w-3.5 h-3.5" /> بيع جزئي
          </button>
          <button type="button" onClick={() => { setType('dividend'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'dividend' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            توزيع نقدي
          </button>
          <button type="button" onClick={() => { setType('split'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'split' || type === 'bonus' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            مجاني/تجزئة
          </button>
        </div>

        {/* Core Shield Breakdown (When Selling Core Position) */}
        {type === 'sell' && (position?.coreShares || 0) > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-600">🛡️</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">درع أسهم الكور:</span>
            </div>
            <div className="font-black text-amber-900 dark:text-amber-200 font-mono-num">
              <span>🔒 {position?.coreShares} كور محمي</span>
              <span className="mx-1.5">|</span>
              <span className="text-emerald-700 dark:text-emerald-400">🎯 {Math.max(0, currentMetrics.openShares - (position?.coreShares || 0))} بيع نشط</span>
            </div>
          </div>
        )}

        {/* Quick Profit Taking Ratios (When Selling) */}
        {type === 'sell' && currentMetrics && currentMetrics.openShares > 0 && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300">
              <span>⚡ جني أرباح سريع (اختر كمية البيع):</span>
              <span className="font-mono-num">{currentMetrics.openShares} سهم متاح</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '25% (ربع)', ratio: 0.25 },
                { label: '33% (ثلث)', ratio: 1 / 3 },
                { label: '50% (نصف)', ratio: 0.5 },
                { label: '100% (الكل)', ratio: 1.0 },
              ].map(preset => {
                const calculatedQty = preset.ratio === 1.0 
                  ? currentMetrics.openShares 
                  : Math.floor(currentMetrics.openShares * preset.ratio);
                const isActive = sharesStr === calculatedQty.toString() && calculatedQty > 0;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSharesStr(calculatedQty.toString());
                      if (!priceStr && position.currentMarketPrice) {
                        setPriceStr(position.currentMarketPrice.toString());
                      }
                    }}
                    className={`py-2 text-xs font-black rounded-xl transition-all ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-black text-slate-500">تاريخ المعاملة</label>
            <input type="date" required value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold font-mono-num" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500">عدد الأسهم</label>
            <input type="number" step="1" required value={sharesStr} onChange={e => setSharesStr(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500">سعر التنفيذ (EGP)</label>
            <input type="number" step="0.001" required value={priceStr} onChange={e => setPriceStr(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold" />
          </div>
        </div>

        {/* Pre-Sell Simulator Preview (Lowest-Price First Live Impact) */}
        {sellPreview && (
          <div className={`rounded-2xl border p-3 space-y-2 text-xs ${
            sellPreview.netPnL >= 0
              ? 'bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-500/[0.06] border-rose-500/30 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-black">
              <span>⚡ معاينة البيع (الأقل سعراً أولاً)</span>
              <span dir="ltr" className={`font-mono-num text-sm ${sellPreview.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {sellPreview.netPnL >= 0 ? '+' : ''}{formatEGP(sellPreview.netPnL)} EGP ({sellPreview.pnlPct >= 0 ? '+' : ''}{sellPreview.pnlPct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold opacity-90">
              <span className="opacity-75">الدفعات المغلقة:</span>
              {sellPreview.matchedLots.map((l, i) => (
                <span key={i} dir="ltr" className="rounded-md bg-white/70 dark:bg-slate-900/60 px-1.5 py-0.5 font-mono-num border border-current/15">
                  {l.shares} × {l.buyPrice.toFixed(2)}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-current/10 text-[11px] font-black">
              {sellPreview.remainingShares > 0 ? (
                <>
                  <span>المتبقي: {sellPreview.remainingShares.toLocaleString()} سهم (م. {sellPreview.newAvgEntry.toFixed(2)})</span>
                  <span className="text-amber-700 dark:text-amber-300">
                    التعادل الحقيقي الجديد: <b dir="ltr">{sellPreview.newBreakEven.toFixed(2)}</b>
                  </span>
                </>
              ) : (
                <span>✓ سيتم إغلاق كامل المركز بالكامل</span>
              )}
            </div>
          </div>
        )}

        {/* Breakeven Ratchet Option */}
        {type === 'sell' && currentMetrics && currentMetrics.avgEntry > currentMetrics.currentStop && (
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            raiseStopToBreakeven 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}>
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
              checked={raiseStopToBreakeven} 
              onChange={e => setRaiseStopToBreakeven(e.target.checked)} 
            />
            <div className="flex-1 text-right">
              <span className="text-xs font-black block">🛡️ حجز الأرباح: رفع الوقف تلقائياً لنقطة الدخول (Breakeven)</span>
              <span className="text-[10px] opacity-75 font-bold block">سيتم رفع الوقف إلى {currentMetrics.avgEntry.toFixed(2)} EGP لحماية باقي الكمية بعد البيع الجزئي</span>
            </div>
          </label>
        )}

        {type === 'buy' && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500">سبب الدخول</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'support', label: 'دعم قوي' },
                  { id: 'breakout', label: 'اختراق' },
                  { id: 'retest', label: 'إعادة اختبار' },
                  { id: 'indicator', label: 'مؤشرات فنية' },
                  { id: 'avg_down', label: 'تعديل متوسط' },
                  { id: 'fomo', label: 'تسرع / FOMO' },
                  { id: 'other', label: 'أخرى' }
                ].map(r => (
                  <button key={r.id} type="button" onClick={() => setEntryReason(r.id)} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${entryReason === r.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{r.label}</button>
                ))}
              </div>
              {entryReason === 'other' && (
                <input type="text" value={customEntryReason} onChange={e => setCustomEntryReason(e.target.value)} placeholder="اكتب سبب الدخول..." className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold" autoFocus />
              )}
            </div>
          </div>
        )}

        {type === 'sell' && (
           <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
             <label className="text-xs font-black text-slate-500">سبب الخروج</label>
             <div className="flex flex-wrap gap-1.5">
               {[
                 { id: 'target', label: 'تحقيق هدف' },
                 { id: 'stop', label: 'ضرب وقف' },
                 { id: 'trailing', label: 'وقف متحرك' },
                 { id: 'panic', label: 'خوف / هلع' },
                 { id: 'greed', label: 'جني سريع' }
               ].map(r => (
                 <button key={r.id} type="button" onClick={() => setExitReason(r.id)} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${exitReason === r.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{r.label}</button>
               ))}
             </div>
           </div>
        )}

        {/* Collapsible Optional Journal (Notes, Portfolio Type, 3MS, Psychology, Rating, Rule Breaker) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtraJournal(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition"
          >
            <span>+ ملاحظات وتقييم نفسي (اختياري)</span>
            <span className="text-[10px] text-slate-400">{showExtraJournal ? 'إخفاء ▲' : 'عرض ▼'}</span>
          </button>

          {showExtraJournal && (
            <div className="p-3.5 pt-2 space-y-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500">ملاحظة سريعة</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: شراء قرب دعم قوي..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold" />
              </div>

              {type === 'buy' && (
                <>
                  <div className="grid grid-cols-2 bg-white dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => setPortfolioType('investment')} className={`py-1.5 rounded-lg font-bold text-xs transition-all ${portfolioType === 'investment' ? 'bg-blue-500 text-white shadow' : 'text-slate-500'}`}>استثمار</button>
                    <button type="button" onClick={() => setPortfolioType('speculation')} className={`py-1.5 rounded-lg font-bold text-xs transition-all ${portfolioType === 'speculation' ? 'bg-blue-500 text-white shadow' : 'text-slate-500'}`}>مضاربة</button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'majorSR', label: 'دعم/مقاومة' },
                      { key: 'bos', label: 'كسر هيكل' },
                      { key: 'retest', label: 'إعادة اختبار' }
                    ].map(item => (
                      <label key={item.key} className={`flex items-center justify-center p-1.5 rounded-lg cursor-pointer transition-all border text-[11px] font-bold ${checklist[item.key as keyof typeof checklist] ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                        <input type="checkbox" className="hidden" checked={checklist[item.key as keyof typeof checklist]} onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {(type === 'buy' || type === 'sell') && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'neutral', label: '😐 محايد' },
                      { id: 'confident', label: '😎 واثق' },
                      { id: 'fomo', label: '🏃 تسرع' },
                      { id: 'fear', label: '😨 خوف' },
                      { id: 'greed', label: '🤑 طمع' }
                    ].map(emo => (
                      <button key={emo.id} type="button" onClick={() => setEmotion(emo.id as any)} className={`py-1 px-2 rounded-lg text-[11px] font-black transition-all border ${emotion === emo.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                        {emo.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-black text-slate-500">جودة التنفيذ</span>
                    <div className="flex items-center gap-1 flex-row-reverse" dir="ltr">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setExecutionRating(star)} className={`text-lg transition-all ${executionRating >= star ? 'text-amber-400' : 'text-slate-300 grayscale opacity-40'}`}>
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${isRuleBreaker ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500" checked={isRuleBreaker} onChange={e => setIsRuleBreaker(e.target.checked)} />
                    <span className="text-[11px] font-bold">مخالفة خطة التداول</span>
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? 'جاري الحفظ...' : transactionToEdit ? 'حفظ التعديلات' : 'إضافة المعاملة'}
        </button>
      
      <ConfirmModal
        isOpen={!!pendingSaveData}
        title="تجاوز السيولة المتاحة"
        message={pendingSaveData?.msg || ''}
        type="warning"
        confirmText="تأكيد الشراء"
        onConfirm={() => {
          if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }}
        onCancel={() => setPendingSaveData(null)}
      />
</form>
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      {content}
    </div>
  );
}
