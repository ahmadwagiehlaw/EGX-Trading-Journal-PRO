import { Save, CheckCircle2, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTrades } from '../context/TradeContext';
import StockAutocomplete from './StockAutocomplete';

export default function NewTradeForm({ 
  initialData, 
  onClose 
}: { 
  initialData?: any; 
  onClose?: () => void;
}) {
  const { addPosition, updatePosition, capitalInvestment, capitalSpeculation, totalOpenCapitalInvestment } = useTrades();

    const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [entryPrice, setEntryPrice] = useState<string>(
    initialData?.entryPrice?.toString() || 
    initialData?.plan?.entryZone?.min?.toString() || 
    ''
  );
  const [targetPrice, setTargetPrice] = useState<string>(
    initialData?.targetPrice?.toString() || 
    initialData?.plan?.target?.toString() || 
    ''
  );
  const [stopLoss, setStopLoss] = useState<string>(
    initialData?.initialStopLoss?.toString() || 
    initialData?.plan?.stop?.toString() || 
    ''
  );
  const [atrStr, setAtrStr] = useState<string>(initialData?.atr15?.toString() || initialData?.plan?.atr?.toString() || '');
  
  useEffect(() => {
    if (initialData?.symbol) setSymbol(initialData.symbol);
    if (initialData?.entryPrice) setEntryPrice(initialData.entryPrice.toString());
    if (initialData?.targetPrice) setTargetPrice(initialData.targetPrice.toString());
    if (initialData?.initialStopLoss) setStopLoss(initialData.initialStopLoss.toString());
  }, [initialData]);

  const [calcResults, setCalcResults] = useState<{sl: string, target: string, shares: string} | null>(null);

  // Risk Auto-Calculation (Preview Only)
  useEffect(() => {
    const atr = parseFloat(atrStr);
    const entry = parseFloat(entryPrice);
    if (!isNaN(atr) && atr > 0 && !isNaN(entry) && entry > 0) {
      const slDistance = 2 * atr;
      const calculatedSl = entry - slDistance;
      const calculatedTarget = entry + (2 * slDistance); // Minimum 2:1 Target
      
      // Use Available Buying Power instead of Total Capital for Position Sizing
      const availableInvestmentPower = capitalInvestment - totalOpenCapitalInvestment;
      const capital = Math.max(0, availableInvestmentPower); 
      
      const maxRiskAmount = capital * 0.01; // 1% default risk of AVAILABLE power
      const sharesByRisk = Math.floor(maxRiskAmount / slDistance);
      const maxAllocationAmount = capital * 0.25; // max 25% allocation of AVAILABLE power
      const sharesByAllocation = Math.floor(maxAllocationAmount / entry);
      const finalShares = Math.min(sharesByRisk, sharesByAllocation);

      setCalcResults({
        sl: calculatedSl.toFixed(2),
        target: calculatedTarget.toFixed(2),
        shares: finalShares.toString()
      });
    } else {
      setCalcResults(null);
    }
  }, [atrStr, entryPrice, capitalInvestment, capitalSpeculation, totalOpenCapitalInvestment]);

  const applyCalculations = () => {
    if (calcResults) {
      setStopLoss(calcResults.sl);
      if (!targetPrice || targetPrice === '0' || targetPrice === '') {
        setTargetPrice(calcResults.target);
      }
    }
  };

  const handleSave = async () => {
    if (!symbol.trim()) return;

    const entry = parseFloat(entryPrice) || 0;
    const target = parseFloat(targetPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const atr15 = parseFloat(atrStr) || initialData?.atr15 || initialData?.atrAtEntry || 0;

    if (initialData?.id) {
      // Editing existing position (merge safely)
      await updatePosition(initialData.id, {
        symbol: symbol.toUpperCase(),
        'plan.entryZone.min': entry,
        'plan.entryZone.max': entry,
        'plan.target': target,
        'plan.stop': sl,
        'plan.atr': atr15,
      } as any);
    } else {
      // Create new TickerPosition strictly as a Plan
      await addPosition({
        symbol: symbol.toUpperCase(),
        portfolioType: 'investment', // legacy field, fallback
        status: 'planning', // Always start as a plan
        plan: {
          strategy: '',
          entryZone: { min: entry, max: entry },
          target,
          stop: sl,
          atr: atr15,
        },
        transactions: [], // No initial transactions
        trailingStop: {
          initial: sl,
          current: sl,
          highestReached: entry,
          atrAtEntry: atr15,
        },
        journal: {
          openedDate: new Date(dateStr).getTime(),
          tags: [],
          isRuleBreaker: false,
          emotion: 'neutral',
        },
      } as any);
    }

    onClose?.();
  };

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">
      
      {/* General Info */}
      <div className="flex gap-4">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            السهم (ابحث بالاسم العربي أو الرمز)
          </label>
          <StockAutocomplete
            value={symbol}
            onChange={(sym) => setSymbol(sym)}
            placeholder="مثال: COMI أو التجاري الدولي..."
          />
        </div>
      </div>



      {/* Date Field */}
      <div className="mt-4">
        <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2 text-center">تاريخ ووقت فتح الخطة/التمركز</label>
        <input 
          type="datetime-local" 
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="w-full text-base font-black text-slate-700 dark:text-slate-300 py-3 px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-center shadow-inner"
          dir="ltr"
        />
      </div>

      {/* Risk Management & Portfolio */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-black text-slate-700 dark:text-slate-300">حاسبة المخاطر اللحظية والمحفظة</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">مؤشر التذبذب ATR (15)</label>
            <input 
              type="number" 
              step="any"
              value={atrStr}
              onChange={(e) => setAtrStr(e.target.value)}
              className="w-full text-sm font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0.00"
              dir="ltr"
            />
            {calcResults ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold flex-1 text-right leading-tight">
                  الوقف: <span className="text-rose-600 font-black font-mono-num">{calcResults.sl}</span> | 
                  الكمية الآمنة: <span className="text-blue-500 font-black font-mono-num">{calcResults.shares}</span>
                </p>
                <button 
                  type="button"
                  onClick={applyCalculations}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  اعتماد ونقل
                </button>
              </div>
            ) : (
              atrStr && parseFloat(atrStr) > 0 && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 text-center">
                  أدخل سعر الدخول لحساب الوقف والكمية...
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Financial Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">سعر الدخول الأول</label>
          <input 
            type="number" 
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full text-base font-black text-blue-700 dark:text-blue-300 py-2 px-3 border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">الهدف (Target)</label>
          <input 
            type="number" 
            step="any"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full text-base font-black text-emerald-700 dark:text-emerald-300 py-2 px-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl focus:border-emerald-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">الوقف (Stop)</label>
          <input 
            type="number" 
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full text-base font-black text-red-700 dark:text-red-300 py-2 px-3 border border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/40 rounded-xl focus:border-red-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!symbol.trim()}
          className="px-8 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initialData?.id ? 'حفظ التعديلات' : 'حفظ التمركز'}
        </button>
      </div>
    </div>
  );
}
