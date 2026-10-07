import { Save, CheckCircle2, Copy } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import StockAutocomplete from './StockAutocomplete';

export default function NewTradeForm({ 
  initialData, 
  onClose 
}: { 
  initialData?: any; 
  onClose?: () => void;
}) {
  const { 
    positions, 
    addPosition, 
    updatePosition, 
    capitalInvestment, 
    capitalSpeculation,
    totalOpenCapitalInvestment, 
    totalOpenCapitalSpeculation,
    defaultRisk 
  } = useTrades();

  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [shares, setShares] = useState<string>(initialData?.shares?.toString() || initialData?.openShares?.toString() || '100');
  const [portfolioType, setPortfolioType] = useState<'investment' | 'speculation'>(initialData?.portfolioType || 'investment');
  const [strategy, setStrategy] = useState<string>(initialData?.plan?.strategy || 'تمركز');
  
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
    if (initialData?.shares) setShares(initialData.shares.toString());
    if (initialData?.portfolioType) setPortfolioType(initialData.portfolioType);
    if (initialData?.plan?.strategy) setStrategy(initialData.plan.strategy);
    if (initialData?.entryPrice) setEntryPrice(initialData.entryPrice.toString());
    if (initialData?.targetPrice) setTargetPrice(initialData.targetPrice.toString());
    if (initialData?.initialStopLoss) setStopLoss(initialData.initialStopLoss.toString());
  }, [initialData]);

  // Risk Auto-Calculation (Derived via useMemo - Pure and instantaneous)
  const calcResults = useMemo(() => {
    const atr = parseFloat(atrStr);
    const entry = parseFloat(entryPrice);
    if (!isNaN(atr) && atr > 0 && !isNaN(entry) && entry > 0) {
      const slDistance = 2 * atr;
      const calculatedSl = entry - slDistance;
      const calculatedTarget = entry + (2 * slDistance); // Minimum 2:1 Target
      
      // Use Available Buying Power based on selected portfolio
      const availablePower = portfolioType === 'speculation'
        ? Math.max(0, capitalSpeculation - totalOpenCapitalSpeculation)
        : Math.max(0, capitalInvestment - totalOpenCapitalInvestment);
      
      const capital = availablePower > 0 ? availablePower : (portfolioType === 'speculation' ? capitalSpeculation : capitalInvestment);
      const riskPct = (defaultRisk && defaultRisk > 0) ? defaultRisk / 100 : 0.01;
      
      const maxRiskAmount = capital * riskPct;
      const sharesByRisk = Math.floor(maxRiskAmount / slDistance);
      const maxAllocationAmount = capital * 0.25; // max 25% allocation of power
      const sharesByAllocation = Math.floor(maxAllocationAmount / entry);
      const finalShares = Math.min(sharesByRisk, sharesByAllocation);

      return {
        sl: calculatedSl.toFixed(2),
        target: calculatedTarget.toFixed(2),
        shares: finalShares > 0 ? finalShares.toString() : '100'
      };
    }
    return null;
  }, [atrStr, entryPrice, portfolioType, capitalInvestment, capitalSpeculation, totalOpenCapitalInvestment, totalOpenCapitalSpeculation, defaultRisk]);

  const applyCalculations = () => {
    if (calcResults) {
      setStopLoss(calcResults.sl);
      if (calcResults.shares) {
        setShares(calcResults.shares);
      }
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
    const numShares = parseInt(shares) || 0;
    const atr15 = parseFloat(atrStr) || initialData?.atr15 || initialData?.atrAtEntry || 0;
    const cleanSym = symbol.trim().toUpperCase();
    const tradeTimestamp = new Date(dateStr).getTime() || Date.now();

    const existingPos = !initialData?.id ? positions.find(p => p.symbol.toUpperCase() === cleanSym) : null;

    if (initialData?.id) {
      // Editing existing position
      await updatePosition(initialData.id, {
        symbol: cleanSym,
        portfolioType,
        'plan.strategy': strategy,
        'plan.entryZone.min': entry,
        'plan.entryZone.max': entry,
        'plan.target': target,
        'plan.stop': sl,
        'plan.atr': atr15,
      } as any);
    } else if (existingPos) {
      // Re-activating existing stock card for a new cycle
      const initialTx = numShares > 0 && entry > 0 ? [{
        id: 'tx_init_' + Math.random().toString(36).substring(2, 8),
        type: 'buy' as const,
        date: tradeTimestamp,
        price: entry,
        shares: numShares,
        amount: entry * numShares,
        portfolioType,
        note: 'دخول وتمركز أولي (دورة جديدة)',
      }] : [];

      await updatePosition(existingPos.id, {
        status: numShares > 0 ? 'active' : 'planning',
        portfolioType,
        transactions: [...(existingPos.transactions || []), ...initialTx],
        plan: {
          strategy,
          entryZone: { min: entry, max: entry },
          target,
          stop: sl,
          atr: atr15,
        },
        trailingStop: {
          initial: sl,
          current: sl,
          highestReached: entry,
          atrAtEntry: atr15,
        },
        'journal.openedDate': tradeTimestamp,
      } as any);
    } else {
      // Create new TickerPosition with initial buy transaction
      const initialTx = numShares > 0 && entry > 0 ? [{
        id: 'tx_init_' + Math.random().toString(36).substring(2, 8),
        type: 'buy' as const,
        date: tradeTimestamp,
        price: entry,
        shares: numShares,
        amount: entry * numShares,
        portfolioType,
        note: 'دخول وتمركز أولي',
      }] : [];

      await addPosition({
        symbol: cleanSym,
        portfolioType,
        status: numShares > 0 ? 'active' : 'planning',
        plan: {
          strategy,
          entryZone: { min: entry, max: entry },
          target,
          stop: sl,
          atr: atr15,
        },
        transactions: initialTx,
        trailingStop: {
          initial: sl,
          current: sl,
          highestReached: entry,
          atrAtEntry: atr15,
        },
        journal: {
          openedDate: tradeTimestamp,
          tags: [strategy].filter(Boolean),
          isRuleBreaker: false,
          emotion: 'neutral',
        },
      } as any);
    }

    onClose?.();
  };

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">
      
      {/* Stock Autocomplete & Portfolio Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            السهم (ابحث بالاسم العربي أو الرمز)
          </label>
          <StockAutocomplete
            value={symbol}
            onChange={(sym) => setSymbol(sym)}
            placeholder="مثال: COMI أو التجاري الدولي..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            المحفظة
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPortfolioType('investment')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                portfolioType === 'investment' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              استثمار 🏛️
            </button>
            <button
              type="button"
              onClick={() => setPortfolioType('speculation')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                portfolioType === 'speculation' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              مضاربة ⚡
            </button>
          </div>
        </div>
      </div>

      {/* Date Field & Strategy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">تاريخ ووقت التنفيذ</label>
          <input 
            type="datetime-local" 
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full text-sm font-black text-slate-700 dark:text-slate-300 py-2.5 px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-center shadow-inner"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">الاستراتيجية / النموذج الفني</label>
          <input 
            type="text" 
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="مثال: اختراق قمة، ارتداد من دعم، VCP..."
            className="w-full text-sm font-bold text-slate-800 dark:text-slate-200 py-2.5 px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Financial Parameters: Entry Price, Quantity, Target, Stop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block text-center">سعر الدخول (شراء)</label>
          <input 
            type="number" 
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full text-base font-black text-blue-700 dark:text-blue-300 py-2.5 px-3 border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block text-center">الكمية (عدد الأسهم)</label>
          <input 
            type="number" 
            step="1"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-full text-base font-black text-slate-900 dark:text-white py-2.5 px-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block text-center">الهدف (Target)</label>
          <input 
            type="number" 
            step="any"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full text-base font-black text-emerald-700 dark:text-emerald-300 py-2.5 px-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl focus:border-emerald-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block text-center">الوقف (Stop Loss)</label>
          <input 
            type="number" 
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full text-base font-black text-red-700 dark:text-red-300 py-2.5 px-3 border border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/40 rounded-xl focus:border-red-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Risk Management & ATR Calculator */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">حاسبة المخاطر اللحظية (اختياري)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">مؤشر التذبذب ATR (15)</label>
            <input 
              type="number" 
              step="any"
              value={atrStr}
              onChange={(e) => setAtrStr(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:border-blue-500 focus:outline-none"
              placeholder="0.00"
              dir="ltr"
            />
          </div>

          {calcResults && (
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold flex-1 text-right leading-tight">
                الوقف: <span className="text-rose-600 font-black font-mono-num">{calcResults.sl}</span> | 
                الكمية المقترحة: <span className="text-blue-500 font-black font-mono-num">{calcResults.shares}</span>
              </p>
              <button 
                type="button"
                onClick={applyCalculations}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shrink-0"
              >
                <Copy className="w-3 h-3" />
                اعتماد الأرقام
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Submit Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!symbol.trim() || !(parseFloat(entryPrice) > 0)}
          className="px-8 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 text-xs"
        >
          <Save className="w-4 h-4" />
          {initialData?.id ? 'حفظ التعديلات' : 'تسجيل وتنفيذ الصفقة'}
        </button>
      </div>
    </div>
  );
}
