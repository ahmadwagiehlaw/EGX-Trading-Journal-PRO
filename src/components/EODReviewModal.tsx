import { useState, useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';
import { 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Zap 
} from 'lucide-react';

interface EODReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EODReviewModal({ isOpen, onClose }: EODReviewModalProps) {
  const { positions, updateMarketPrice, addStickyNote, commissionRate } = useTrades();

  // Step 1: Active positions prices
  const activePositions = useMemo(() => {
    return positions.filter(p => p.status === 'active' && computePositionMetrics(p, commissionRate).openShares > 0);
  }, [positions, commissionRate]);

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activePositions.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      init[p.id] = (p.currentMarketPrice || metrics.avgEntry).toString();
    });
    return init;
  });

  // Step 2: Discipline & Psychology inputs
  const [ruleBroken, setRuleBroken] = useState<boolean>(false);
  const [emotion, setEmotion] = useState<'confident' | 'neutral' | 'fomo' | 'fear' | 'revenge'>('confident');
  const [dailyLesson, setDailyLesson] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Computed metrics for today
  const todayPnL = useMemo(() => {
    let realizedToday = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    positions.forEach(p => {
      const m = computePositionMetrics(p, commissionRate);
      if (m.realizedEvents) {
        m.realizedEvents.forEach(evt => {
          if (evt.date >= todayStart.getTime()) {
            realizedToday += evt.netPnL;
          }
        });
      }
    });

    return realizedToday;
  }, [positions, commissionRate]);

  if (!isOpen) return null;

  const handlePriceChange = (id: string, val: string) => {
    setPrices(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveEOD = async () => {
    setIsSaving(true);
    try {
      // 1. Update prices for all open positions
      for (const pos of activePositions) {
        const pStr = prices[pos.id];
        const newPrice = parseFloat(pStr);
        if (!isNaN(newPrice) && newPrice > 0 && newPrice !== pos.currentMarketPrice) {
          await updateMarketPrice(pos.id, newPrice);
        }
      }

      // 2. Save Daily Note & Review
      const dateStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const noteContent = `🌙 مراجعة إغلاق الجلسة - ${dateStr}
----------------------------------------
• الانضباط بالقواعد: ${ruleBroken ? '⚠️ تم ارتكاب مخالفة' : '✅ منضبط تماماً'}
• الحالة النفسية: ${emotion}
• الأرباح المحققة اليوم: ${todayPnL > 0 ? '+' : ''}${formatEGP(todayPnL)} EGP
• درس اليوم: ${dailyLesson || 'لا توجد ملاحظات خاصة'}`;

      await addStickyNote({
        title: `ملخص جلسة ${new Date().toLocaleDateString('en-GB')}`,
        content: noteContent,
        color: ruleBroken ? 'bg-amber-100 border-amber-300' : 'bg-emerald-100 border-emerald-300'
      });

      setIsCompleted(true);
      setTimeout(() => {
        setIsCompleted(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error("Error saving EOD review:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-amber-400">
              <Moon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                بطاقة المراجعة المسائية في 60 ثانية
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  EOD Snapshot
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-bold">تحديث الأسعار، فحص الانضباط، وتوثيق حصاد اليوم</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Section 1: Fast Price Update for Open Positions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-500 fill-current" />
                1. أسعار إغلاق اليوم للأسهم النشطة ({activePositions.length} سهم)
              </label>
              <span className="text-[10px] text-slate-400 font-bold">تحديث سريع في 10 ثوانٍ</span>
            </div>

            {activePositions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                لا توجد مراكز نشطة مفتوحة حالياً لتحديث أسعارها.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {activePositions.map(pos => {
                  const m = computePositionMetrics(pos, commissionRate);
                  const currentVal = prices[pos.id] || '';
                  const numVal = parseFloat(currentVal);
                  const isProfit = !isNaN(numVal) && numVal > m.avgEntry;

                  return (
                    <div key={pos.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-slate-900 dark:text-white font-mono-num block" dir="ltr">
                          {pos.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          دخول: {m.avgEntry.toFixed(2)} ج
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number"
                          step="0.01"
                          value={currentVal}
                          onChange={e => handlePriceChange(pos.id, e.target.value)}
                          className={`w-24 text-left font-black font-mono-num text-xs py-1.5 px-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            isProfit 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' 
                              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                          }`}
                          dir="ltr"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">ج</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Daily Discipline & Psychology Check */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              2. تقييم الانضباط والمشاعر اليومية
            </label>

            {/* Rule Broken Yes/No Switch */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                هل تم كسر أي قاعدة من قواعد خطتك اليوم (فومو، توسيع وقف، استعجال)؟
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRuleBroken(false)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border ${
                    !ruleBroken 
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  لا، منضبط تماماً 🛡️
                </button>
                <button
                  type="button"
                  onClick={() => setRuleBroken(true)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border ${
                    ruleBroken 
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  نعم، تم كسر قاعدة ⚠️
                </button>
              </div>
            </div>

            {/* Dominant Emotion */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">المشاعر السائدة أثناء التداول اليوم:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'confident', label: 'واثق وهادئ 😎', color: 'emerald' },
                  { id: 'neutral', label: 'محايد وطبيعي 😐', color: 'blue' },
                  { id: 'fomo', label: 'فومو واستعجال 😰', color: 'amber' },
                  { id: 'fear', label: 'خوف وتردد 😨', color: 'purple' },
                  { id: 'revenge', label: 'انتقام وغضب 😡', color: 'rose' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEmotion(item.id as any)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-black border transition-all text-center ${
                      emotion === item.id 
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Lesson Input */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">أهم درس أو ملاحظة خرجت بها من جلسة اليوم:</span>
              <input 
                type="text"
                placeholder="مثال: الالتزام بالهدف وعدم مطاردة السهم بعد الفجوة..."
                value={dailyLesson}
                onChange={e => setDailyLesson(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 3: Today's Summary Snapshot */}
          <div className="p-3.5 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">صافي الأرباح المحققة اليوم:</span>
            </div>
            <span className={`text-sm font-black font-mono-num ${
              todayPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`} dir="ltr">
              {todayPnL > 0 ? '+' : ''}{formatEGP(todayPnL)} EGP
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs"
          >
            إلغاء
          </button>
          
          <button 
            type="button"
            onClick={handleSaveEOD}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs disabled:opacity-50"
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                تم حفظ مراجعة الجلسة بنجاح!
              </>
            ) : isSaving ? (
              'جاري الحفظ والتحديث...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                إتمام مراجعة إغلاق الجلسة
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
