import { useState } from 'react';
import { ArrowUpRight, ArrowDownToLine, Lock, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';

export default function ActiveTrades({ tradeId, onClose }: { tradeId: string, onClose: () => void }) {
  const { trades, updateTrailingStop, closeTrade } = useTrades();
  const trade = trades.find(t => t.id === tradeId);
  
  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [exitPrice, setExitPrice] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  const [emotion, setEmotion] = useState<string>('neutral');
  const [lesson, setLesson] = useState<string>('');
  const [mistake, setMistake] = useState<string>('');

  if (!trade) return null;

  const handleUpdateTrailingStop = () => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= trade.highestPrice) {
      setError("يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً.");
      return;
    }

    const calculatedNewStop = highest - (2 * trade.atrAtEntry);

    // Rule: Stop Loss CANNOT move down (Steve Burns Rule #30)
    if (calculatedNewStop < trade.currentStopLoss) {
      setError("مخالفة قاعدة ستيف بيرنز: الوقف لا يتحرك للخلف أبداً. السعر الجديد يعطي وقف خسارة أقل من الحالي.");
      return;
    }

    setError(null);
    updateTrailingStop(trade.id, highest, calculatedNewStop);
    setNewHighestPrice('');
  };

  const handleCloseTrade = () => {
    const exitVal = parseFloat(exitPrice);
    if (isNaN(exitVal) || exitVal <= 0) {
      setError('يرجى إدخال سعر إغلاق صحيح');
      return;
    }
    closeTrade(tradeId, exitVal, emotion, lesson, mistake);
    onClose();
  };

  return (
    <div className="w-full space-y-8" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Right Column: Active Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col relative z-10 h-full">
          <AdvancedRealTimeChart 
            symbol={`EGX:${trade.symbol}`}
            interval="D"
            theme="light"
            locale="ar_AE"
            autosize
            allow_symbol_change={false}
            hide_side_toolbar={false}
            details={true}
            save_image={true}
            timezone="Africa/Cairo"
          />
        </div>

        {/* Left Column: Trailing Stop Engine & Close Trade */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 flex flex-col gap-8 h-full">

          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">محرك الوقف المتحرك</h2>
              <p className="text-slate-500 font-bold">يمنع تعديل الوقف للأسفل ميكانيكياً</p>
            </div>
          </div>

          <div className="bg-transparent rounded-[2rem] p-6 md:p-8 border border-white/60 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
            <div>
              <h3 className="text-3xl font-black text-blue-700 tracking-tighter" dir="ltr">{trade.symbol}</h3>
              <p className="text-slate-500 font-bold mt-1">سعر الدخول: {trade.entryPrice.toFixed(2)} EGP</p>
            </div>
            <div className="text-left">
              <p className="text-slate-500 font-bold text-sm">الكمية</p>
              <p className="text-xl font-black text-slate-900">{trade.shares.toLocaleString()} سهم</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold">
                <ArrowDownToLine className="w-5 h-5 text-slate-400" />
                الوقف المبدئي (الأصلي)
              </div>
              <div className="text-3xl font-black text-slate-800" dir="ltr">{trade.initialStopLoss.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 relative">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 rounded-r-2xl"></div>
              <div className="flex items-center gap-2 mb-2 text-red-700 font-bold">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                الوقف المتحرك (الحالي)
              </div>
              <div className="text-4xl font-black text-red-600" dir="ltr">{trade.currentStopLoss.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              تحديث أعلى سعر وصل له السهم
            </h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <input 
                  type="number"
                  value={newHighestPrice}
                  onChange={(e) => setNewHighestPrice(e.target.value)}
                  placeholder={`أعلى من ${trade.highestPrice.toFixed(2)}`}
                  className="w-full text-2xl font-black text-slate-900 py-4 px-6 border-2 border-white/60 bg-white/40 backdrop-blur-md rounded-xl focus:bg-white/60 focus:border-blue-400 focus:shadow-md transition-all text-left outline-none placeholder:text-slate-400"
                  dir="ltr"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">EGP</div>
              </div>
              <button 
                onClick={handleUpdateTrailingStop}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:translate-y-0"
              >
                تحديث الوقف
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-100/80 text-red-700 font-bold rounded-xl flex items-center gap-3 border border-red-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            <p className="text-sm text-blue-600/80 font-bold mt-4">
              ملاحظة: الوقف يُحسب تلقائياً بطرح مسافة (2 × ATR) من السعر الجديد.
            </p>
            </div>
          </div>

          {/* Close Trade Section */}
          <div className="mt-auto pt-6 border-t border-white/60">
            {!isClosing ? (
              <button 
                onClick={() => setIsClosing(true)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                إغلاق هذه الصفقة (تصفية المركز)
              </button>
            ) : (
              <div className="space-y-4 bg-slate-900 p-6 rounded-2xl shadow-inner border border-slate-700">
                <h4 className="text-white font-black text-lg text-center mb-4">تأكيد إغلاق الصفقة</h4>
                <div>
                  <label className="text-sm font-bold text-slate-400 block mb-2">سعر الإغلاق الفعلي (EGP)</label>
                  <input 
                    type="number" 
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 px-4 text-white font-black focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="مثال: 85.00"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-400 block mb-2">كيف كان شعورك أثناء الصفقة؟</label>
                  <select 
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="neutral">😐 محايد (طبيعي)</option>
                    <option value="confident">😎 واثق ومنضبط</option>
                    <option value="fomo">😰 فومو (خوف من ضياع الفرصة)</option>
                    <option value="fear">😨 خوف وتردد</option>
                    <option value="greed">🤑 طمع (عدم جني ربح)</option>
                    <option value="revenge">😡 انتقام من السوق</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-400 block mb-2">خطأ فني أو نفسي وقعت فيه (إن وجد)</label>
                  <input 
                    type="text" 
                    value={mistake}
                    onChange={(e) => setMistake(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-4 text-white font-bold focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="مثال: حركت الوقف بدون سبب مقنع..."
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-400 block mb-2">ماذا تعلمت من هذه الصفقة؟ 📝</label>
                  <textarea 
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 px-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors min-h-[60px]"
                    placeholder="اكتب درس مستفاد للمستقبل..."
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCloseTrade}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black py-3 rounded-xl shadow-lg transition-all"
                  >
                    تأكيد وإغلاق
                  </button>
                  <button 
                    onClick={() => setIsClosing(false)}
                    className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
