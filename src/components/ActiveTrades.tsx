import { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  Lock, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  ArrowDownLeft
} from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { computePositionMetrics } from '../utils/calculations';
import TransactionFormModal from './TransactionFormModal';

export default function ActiveTrades({ tradeId, onClose }: { tradeId: string; onClose: () => void }) {
  const { positions, updateTrailingStop, closePosition } = useTrades();
  const { theme } = useTheme();
  
  const position = positions.find(p => p.id === tradeId);
  const metrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position);
  }, [position]);

  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [exitPrice, setExitPrice] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  const [emotion, setEmotion] = useState<string>('confident');
  const [lesson, setLesson] = useState<string>('');
  const [mistake, setMistake] = useState<string>('');
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | null>(null);

  if (!position || !metrics) return null;

  const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;
  const currentStop = metrics.currentStop;
  const atr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;

  const handleUpdateTrailingStop = async () => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (${currentHighest.toFixed(2)} EGP).`);
      return;
    }

    const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;

    // Rule: Stop Loss CANNOT move down (Steve Burns Rule #30)
    if (calculatedNewStop < currentStop) {
      setError("مخالفة قاعدة ستيف بيرنز: الوقف لا يتحرك للخلف أبداً. السعر الجديد يعطي وقف خسارة أقل من الحالي.");
      return;
    }

    setError(null);
    await updateTrailingStop(position.id, highest, calculatedNewStop);
    setNewHighestPrice('');
  };

  const handleCloseTrade = async () => {
    const exitVal = parseFloat(exitPrice);
    if (isNaN(exitVal) || exitVal <= 0) {
      setError('يرجى إدخال سعر إغلاق صحيح.');
      return;
    }
    await closePosition(position.id, exitVal, emotion, lesson, mistake);
    onClose();
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Right Column: Live TradingView Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[520px] flex flex-col relative z-10">
          <AdvancedRealTimeChart 
            symbol={`EGX:${position.symbol}`}
            interval="D"
            theme={theme === 'dark' ? 'dark' : 'light'}
            locale="ar_AE"
            autosize
            allow_symbol_change={false}
            hide_side_toolbar={false}
            details={true}
            save_image={true}
            timezone="Africa/Cairo"
          />
        </div>

        {/* Left Column: Trailing Stop Engine & Ledger Control */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-sm">

          <div>
            {/* Header / Ticker Summary */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position.symbol}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                    metrics.isOpen 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {metrics.isOpen ? 'مركز مفتوح' : 'مغلق'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
              </div>

              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics.openShares.toLocaleString()} سهم</p>
              </div>
            </div>

            {/* Trailing Stop Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400 font-bold text-xs">
                  <ArrowDownToLine className="w-4 h-4" />
                  الوقف المبدئي
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono-num" dir="ltr">
                  {(position.trailingStop?.initial || position.plan?.stop || 0).toFixed(2)}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-100 dark:border-red-900/60 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 rounded-r-2xl"></div>
                <div className="flex items-center justify-center gap-1.5 mb-1 text-red-600 dark:text-red-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  الوقف المتحرك الحالي
                </div>
                <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono-num" dir="ltr">
                  {currentStop.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Trailing Stop Adjustment Input */}
            {metrics.isOpen && (
              <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/50 space-y-3">
                <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  تحديث أعلى سعر وصل له السهم (Trailing Stop Engine)
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      step="any"
                      value={newHighestPrice}
                      onChange={(e) => setNewHighestPrice(e.target.value)}
                      placeholder={`أعلى من ${currentHighest.toFixed(2)}`}
                      className="w-full text-lg font-black text-slate-900 dark:text-white py-2.5 px-4 border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-left outline-none"
                      dir="ltr"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">EGP</div>
                  </div>
                  <button 
                    onClick={handleUpdateTrailingStop}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs shrink-0"
                  >
                    تحديث الوقف ميكانيكياً
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-100/90 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                
                <p className="text-[11px] text-blue-600/90 dark:text-blue-400 font-bold">
                  * قاعدة ستيف بيرنز #30: الوقف يُسحب للأعلى تلقائياً بفاصل (2 × ATR) ولا يتحرك للأسفل أبداً لحماية الأرباح.
                </p>
              </div>
            )}
          </div>

          {/* Quick Partial Transactions Row */}
          {metrics.isOpen && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTxModalType('buy')}
                className="flex-1 py-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                شراء إضافي (تمركز)
              </button>
              <button
                onClick={() => setTxModalType('sell')}
                className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-black rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                بيع جزئي (جني ربح)
              </button>
            </div>
          )}

          {/* Close Position (Full Exit) Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {!isClosing ? (
              metrics.isOpen && (
                <button 
                  onClick={() => setIsClosing(true)}
                  className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  إغلاق وتصفية كامل المركز المالي
                </button>
              )
            ) : (
              <div className="space-y-4 bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-700 text-white text-xs">
                <h4 className="font-black text-sm text-center text-slate-100">تأكيد إغلاق وتصفية المركز</h4>
                
                <div>
                  <label className="text-slate-400 font-bold block mb-1">سعر الخروج الفعلي (EGP)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-3 text-white font-black focus:border-blue-500 outline-none text-base text-center"
                    placeholder="85.00"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 font-bold block mb-1">الحالة النفسية أثناء التداول</label>
                  <select 
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-3 text-white font-bold outline-none"
                  >
                    <option value="confident">😎 واثق ومنضبط</option>
                    <option value="neutral">😐 محايد (طبيعي)</option>
                    <option value="fomo">😰 فومو (خوف من ضياع الفرصة)</option>
                    <option value="fear">😨 خوف وتردد</option>
                    <option value="greed">🤑 طمع (تأخير جني الأرباح)</option>
                    <option value="revenge">😡 انتقام وتداول عاطفي</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">الخطأ الفني أو النفسي (إن وجد)</label>
                  <input 
                    type="text" 
                    value={mistake}
                    onChange={(e) => setMistake(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-3 text-white font-bold outline-none"
                    placeholder="مثال: فومو، عدم الالتزام بالوقف..."
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">الدرس المستفاد للمستقبل 📝</label>
                  <textarea 
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-3 text-white font-bold outline-none min-h-[50px]"
                    placeholder="ماذا تعلمت من هذا المركز المالي؟"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button 
                    onClick={handleCloseTrade}
                    className="flex-1 bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black py-2.5 rounded-xl shadow-md transition-all text-xs"
                  >
                    تأكيد التصفية والإغلاق
                  </button>
                  <button 
                    onClick={() => setIsClosing(false)}
                    className="px-5 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Partial Transaction Modal */}
      <TransactionFormModal
        isOpen={!!txModalType}
        onClose={() => setTxModalType(null)}
        position={position}
        defaultType={txModalType || 'buy'}
      />
    </div>
  );
}
