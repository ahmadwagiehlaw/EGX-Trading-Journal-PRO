import { useState, useMemo } from 'react';
import { Plus, ArrowDownLeft, X, AlertCircle, TrendingUp } from 'lucide-react';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: TickerPosition | null;
  defaultType?: 'buy' | 'sell';
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  position,
  defaultType = 'buy'
}: TransactionFormModalProps) {
  const { addTransaction } = useTrades();

  const [type, setType] = useState<'buy' | 'sell'>(defaultType);
  const [priceStr, setPriceStr] = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current metrics of position
  const currentMetrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position);
  }, [position]);

  // Projected metrics preview
  const projectedMetrics = useMemo(() => {
    if (!position || !currentMetrics) return null;
    const price = parseFloat(priceStr) || 0;
    const shares = parseInt(sharesStr, 10) || 0;

    if (price <= 0 || shares <= 0) return null;

    if (type === 'buy') {
      const currentCost = currentMetrics.avgEntry * currentMetrics.totalBought;
      const newCost = currentCost + (price * shares);
      const newTotalShares = currentMetrics.totalBought + shares;
      const newAvgEntry = newTotalShares > 0 ? newCost / newTotalShares : 0;
      const newOpenShares = currentMetrics.openShares + shares;

      return {
        newAvgEntry,
        newOpenShares,
        totalTransactionAmount: price * shares,
        pnlImpact: 0,
      };
    } else {
      // Sell
      const pnl = (price - currentMetrics.avgEntry) * shares;
      const newOpenShares = Math.max(0, currentMetrics.openShares - shares);

      return {
        newAvgEntry: currentMetrics.avgEntry,
        newOpenShares,
        totalTransactionAmount: price * shares,
        pnlImpact: pnl,
      };
    }
  }, [position, currentMetrics, type, priceStr, sharesStr]);

  if (!isOpen || !position || !currentMetrics) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(priceStr);
    const shares = parseInt(sharesStr, 10);

    if (isNaN(price) || price <= 0) {
      setError('يرجى إدخال سعر صحيح أكبر من الصفر.');
      return;
    }

    if (isNaN(shares) || shares <= 0) {
      setError('يرجى إدخال عدد أسهم صحيح أكبر من الصفر.');
      return;
    }

    if (type === 'sell' && shares > currentMetrics.openShares) {
      setError(`لا يمكن بيع كمية (${shares}) أكبر من الكمية المفتوحة المتبقية (${currentMetrics.openShares} سهم).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await addTransaction(position.id, {
        type,
        date: Date.now(),
        price,
        shares,
        amount: price * shares,
        note: note.trim() || (type === 'buy' ? 'شراء إضافي' : 'بيع جزئي'),
      });
      setIsSubmitting(false);
      onClose();
      // Reset form
      setPriceStr('');
      setSharesStr('');
      setNote('');
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'حدث خطأ أثناء حفظ الحركة المالية.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
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

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Buy / Sell Toggle Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => { setType('buy'); setError(null); }}
              className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'buy'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              شراء إضافي (تمركز/تعزيز)
            </button>
            <button
              type="button"
              onClick={() => { setType('sell'); setError(null); }}
              className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'sell'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              بيع جزئي (جني ربح/تخفيف)
            </button>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400">سعر التنفيذ (EGP)</label>
              <input
                type="number"
                step="any"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all text-center text-lg"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400">عدد الأسهم</label>
              <input
                type="number"
                step="1"
                value={sharesStr}
                onChange={(e) => setSharesStr(e.target.value)}
                placeholder="100"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all text-center text-lg"
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400">ملاحظات العملية (السبب الفني)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'buy' ? 'مثال: اختراق مع فوليوم عالي، تأكيد إعادة الاختبار' : 'مثال: جني 50% من الأرباح عند المقاومة'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Live Preview Calculation Box */}
          {projectedMetrics && (
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 space-y-3 shadow-inner border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  معاينة التأثير الحسابي المباشر
                </span>
                <span>إجمالي القيمة: {formatEGP(projectedMetrics.totalTransactionAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                {type === 'buy' ? (
                  <>
                    <div className="bg-slate-800/80 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-700/50">
                      <p className="text-[11px] text-slate-400 font-bold mb-0.5">متوسط الدخول الجديد</p>
                      <p className="font-black text-blue-400 text-base" dir="ltr">
                        {projectedMetrics.newAvgEntry.toFixed(2)} EGP
                      </p>
                    </div>
                    <div className="bg-slate-800/80 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-700/50">
                      <p className="text-[11px] text-slate-400 font-bold mb-0.5">إجمالي الأسهم المفتوحة</p>
                      <p className="font-black text-slate-200 text-base" dir="ltr">
                        {projectedMetrics.newOpenShares} سهم
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-800/80 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-700/50">
                      <p className="text-[11px] text-slate-400 font-bold mb-0.5">الربح/الخسارة المحققة</p>
                      <p className={`font-black text-base ${projectedMetrics.pnlImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                        {projectedMetrics.pnlImpact > 0 ? '+' : ''}{projectedMetrics.pnlImpact.toFixed(0)} EGP
                      </p>
                    </div>
                    <div className="bg-slate-800/80 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-700/50">
                      <p className="text-[11px] text-slate-400 font-bold mb-0.5">الأسهم المتبقية</p>
                      <p className="font-black text-slate-200 text-base" dir="ltr">
                        {projectedMetrics.newOpenShares} سهم
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                type === 'buy'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? 'جاري الحفظ...' : type === 'buy' ? 'تأكيد إضافة الشراء' : 'تأكيد تنفيذ البيع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
