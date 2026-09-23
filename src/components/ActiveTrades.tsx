import { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  Lock, 
  Maximize2,
  Minimize2,
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  ArrowDownLeft,
  LineChart,
  Target
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
  
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

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


  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className={isChartExpanded ? "flex flex-col" : "grid lg:grid-cols-2 gap-6 items-stretch"}>
        
        {/* Right Column: Live TradingView Chart */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${isChartExpanded ? 'h-[80vh]' : 'min-h-[520px]'}`}>
          <button 
            onClick={() => setIsChartExpanded(!isChartExpanded)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
            title={isChartExpanded ? "تصغير الشارت" : "تكبير الشارت"}
          >
            {isChartExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            <span className="text-xs font-bold hidden sm:inline">{isChartExpanded ? "تصغير" : "تكبير الشاشة"}</span>
          </button>
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
        <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex-col justify-between space-y-6 shadow-sm ${isChartExpanded ? 'hidden' : 'flex'}`}>

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

            {/* Plan vs Reality Visual Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                  <LineChart className="w-4.5 h-4.5 text-blue-500" />
                  المخطط مقابل الواقع (Plan vs Reality)
                </h4>
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 border ${
                  metrics.realizedPnL > 0 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400' 
                    : metrics.realizedPnL < 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}>
                  صافي الأرباح المحققة: {metrics.realizedPnL > 0 ? '+' : ''}{metrics.realizedPnL.toFixed(2)} EGP
                </div>
              </div>
              
              <div className="relative h-12 w-full flex items-center mt-6 mb-2">
                {/* Track */}
                <div className="absolute w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  {position.plan?.target && position.plan?.stop ? (
                    <div 
                      className="h-full bg-gradient-to-l from-emerald-400 via-blue-400 to-rose-400 opacity-80"
                      style={{ width: '100%' }}
                    />
                  ) : null}
                </div>

                {/* Markers */}
                {position.plan?.target && position.plan?.stop ? (() => {
                  const minP = position.plan.stop;
                  const maxP = position.plan.target;
                  const range = maxP - minP;
                  const entryPercent = Math.max(0, Math.min(100, ((metrics.avgEntry - minP) / range) * 100));
                  const stopPercent = 0; // stop is at 0%
                  const targetPercent = 100; // target is at 100%
                  const trailingStopPercent = Math.max(0, Math.min(100, ((currentStop - minP) / range) * 100));

                  return (
                    <>
                      {/* Target Marker */}
                      <div className="absolute left-0 -top-8 text-center transform -translate-x-1/2">
                        <span className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400">الهدف 🎯</span>
                        <span className="block text-[11px] font-mono-num font-bold text-slate-700 dark:text-slate-300">{maxP.toFixed(2)}</span>
                      </div>
                      
                      {/* Stop Marker */}
                      <div className="absolute right-0 -top-8 text-center transform translate-x-1/2">
                        <span className="block text-[10px] font-black text-rose-600 dark:text-rose-400">الوقف 🛡️</span>
                        <span className="block text-[11px] font-mono-num font-bold text-slate-700 dark:text-slate-300">{minP.toFixed(2)}</span>
                      </div>

                      {/* Entry Marker */}
                      <div 
                        className="absolute -top-9 text-center transform translate-x-1/2 z-10"
                        style={{ right: `${entryPercent}%` }}
                      >
                        <span className="block text-[10px] font-black text-blue-600 dark:text-blue-400">الدخول</span>
                        <span className="block text-[11px] font-mono-num font-black text-slate-900 dark:text-white bg-white/80 dark:bg-slate-800/80 px-1 rounded">{metrics.avgEntry.toFixed(2)}</span>
                        <div className="mx-auto w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-500 mt-0.5 border-[2.5px] border-white dark:border-slate-800 shadow-sm relative">
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-200 dark:bg-blue-800/50 -z-10"></div>
                        </div>
                      </div>

                      {/* Trailing Stop Marker */}
                      {currentStop > minP && (
                        <div 
                          className="absolute -bottom-8 text-center transform translate-x-1/2 z-10"
                          style={{ right: `${trailingStopPercent}%` }}
                        >
                          <div className="mx-auto w-3.5 h-3.5 rounded-full bg-orange-500 dark:bg-orange-400 mb-0.5 border-[2.5px] border-white dark:border-slate-800 shadow-sm relative">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-orange-200 dark:bg-orange-800/50 -z-10"></div>
                          </div>
                          <span className="block text-[10px] font-black text-orange-600 dark:text-orange-400">وقف متحرك</span>
                          <span className="block text-[11px] font-mono-num font-black text-slate-900 dark:text-white">{currentStop.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <div className="text-[11px] font-bold text-slate-400 text-center w-full absolute">
                    الخطة غير مكتملة (يرجى إضافة هدف ووقف للخطة)
                  </div>
                )}
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
            {metrics.isOpen && (
              <button 
                onClick={() => setTxModalType('sellAll')}
                className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
              >
                <CheckCircle className="w-4 h-4" />
                إغلاق وتصفية كامل المركز المالي
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Partial Transaction Modal */}
      <TransactionFormModal
        isOpen={!!txModalType}
        onClose={() => setTxModalType(null)}
        position={position}
        defaultType={txModalType === 'sellAll' ? 'sell' : txModalType || 'buy'}
        defaultShares={txModalType === 'sellAll' ? metrics.openShares.toString() : ''}
      />
    </div>
  );
}
