import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics } from '../utils/calculations';

interface BatchPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchPriceModal({ isOpen, onClose }: BatchPriceModalProps) {
  const { positions, updatePosition, commissionRate } = useTrades();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activePositions = positions.filter(p => {
    const m = computePositionMetrics(p, commissionRate);
    return p.status === 'active' && m.openShares > 0;
  });

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      activePositions.forEach(p => {
        const m = computePositionMetrics(p, commissionRate);
        initial[p.id] = (p.currentMarketPrice || m.currentPrice || m.avgEntry).toFixed(2);
      });
      setPrices(initial);
      setSavedSuccess(false);
    }
  }, [isOpen, positions]);

  if (!isOpen) return null;

  const handlePriceChange = (posId: string, val: string) => {
    setPrices(prev => ({ ...prev, [posId]: val }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatePromises = activePositions.map(async (pos) => {
        const inputVal = parseFloat(prices[pos.id]);
        if (isNaN(inputVal) || inputVal <= 0) return;

        const metrics = computePositionMetrics(pos, commissionRate);
        const data: any = { currentMarketPrice: inputVal };

        // Auto-ratchet trailing stop if hitting a new peak
        const peak = pos.trailingStop?.highestReached || metrics.avgEntry;
        if (inputVal > peak) {
          const atr = pos.trailingStop?.atrAtEntry || pos.plan?.atr || 0;
          const mult = pos.trailingStop?.atrMultiplier || 2;
          const calc = atr > 0 ? inputVal - mult * atr : inputVal * 0.95;
          const newStop = calc > metrics.currentStop && calc < inputVal ? calc : metrics.currentStop;
          
          data.trailingStop = {
            initial: pos.trailingStop?.initial || pos.plan?.stop || metrics.currentStop,
            current: newStop,
            highestReached: inputVal,
            atrAtEntry: atr,
            ...(pos.trailingStop?.atrMultiplier ? { atrMultiplier: pos.trailingStop.atrMultiplier } : {})
          };
          data.highestPrice = inputVal;
          data.currentStopLoss = newStop;
        }

        await updatePosition(pos.id, data);
      });

      await Promise.all(updatePromises);
      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (error) {
      console.error('Failed to batch update prices:', error);
      setIsSaving(false);
      alert('حدث خطأ أثناء حفظ الأسعار. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                تحديث أسعار المحفظة السريع
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                حدّث أسعار جميع أسهمك المفتوحة ({activePositions.length} سهم) في ثوانٍ معدودة.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table / Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {activePositions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold">
              لا توجد أسهم مفتوحة حالياً في المحفظة لتحديث أسعارها.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-100/70 dark:bg-slate-800/80 px-4 py-2.5 text-[11px] font-black text-slate-500">
                <div className="col-span-4">السهم والكمية</div>
                <div className="col-span-3 text-center">متوسط الدخول</div>
                <div className="col-span-5 text-left">السعر اللحظي الحالي (EGP)</div>
              </div>

              {activePositions.map((pos) => {
                const metrics = computePositionMetrics(pos, commissionRate);
                const currentVal = parseFloat(prices[pos.id] || '0');
                const pnl = currentVal > 0 && metrics.avgEntry > 0 
                  ? (currentVal - metrics.avgEntry) * metrics.openShares 
                  : 0;
                const pnlPct = metrics.avgEntry > 0 && currentVal > 0 
                  ? ((currentVal - metrics.avgEntry) / metrics.avgEntry) * 100 
                  : 0;

                return (
                  <div key={pos.id} className="grid grid-cols-12 items-center px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="col-span-4 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                        {pos.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white" dir="ltr">{pos.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono-num">{metrics.openShares} سهم</div>
                      </div>
                    </div>

                    <div className="col-span-3 text-center font-black font-mono-num text-xs text-slate-600 dark:text-slate-300" dir="ltr">
                      {metrics.avgEntry.toFixed(2)}
                    </div>

                    <div className="col-span-5 flex items-center justify-end gap-2">
                      {pnl !== 0 && (
                        <span className={`text-[10px] font-black font-mono-num px-1.5 py-0.5 rounded-md ${
                          pnl > 0 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        }`} dir="ltr">
                          {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                        </span>
                      )}
                      <input
                        type="number"
                        step="0.001"
                        value={prices[pos.id] || ''}
                        onChange={(e) => handlePriceChange(pos.id, e.target.value)}
                        placeholder="0.00"
                        className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-center font-mono-num font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            disabled={isSaving || activePositions.length === 0}
            onClick={handleSaveAll}
            className="px-7 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                تم التحديث بنجاح!
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                {isSaving ? 'جاري التحديث...' : 'حفظ وتحديث كل الأسعار'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
