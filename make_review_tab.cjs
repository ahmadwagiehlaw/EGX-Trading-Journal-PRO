const fs = require('fs');

const content = `import { useState, useMemo } from 'react';
import { Layers, Plus, Calendar as CalendarIcon, CheckCircle, AlertOctagon, Target } from 'lucide-react';
import { useTrades, type WeeklyReview } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';

export default function WeeklyReviewTab() {
  const { weeklyReviews, addWeeklyReview, positions, commissionRate } = useTrades();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');

  // Auto-calculate stats for the past 7 days
  const currentStats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Find positions closed in the last 7 days
    const recentClosed = positions.filter(p => {
      if (p.status !== 'closed') return false;
      const lastTx = p.transactions && p.transactions.length > 0 ? [...p.transactions].sort((a,b)=>b.date - a.date)[0] : null;
      if (!lastTx) return false;
      return lastTx.date >= sevenDaysAgo;
    });

    let pnl = 0;
    let won = 0;
    
    recentClosed.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      pnl += metrics.netRealizedPnL;
      if (metrics.netRealizedPnL > 0) won++;
    });

    return {
      tradesCount: recentClosed.length,
      pnl,
      winRate: recentClosed.length > 0 ? (won / recentClosed.length) * 100 : 0
    };
  }, [positions, commissionRate]);

  const handleSave = () => {
    if (!whatWentWell || !whatWentWrong || !focusNextWeek) {
      alert('يرجى تعبئة جميع الحقول للتأمل الذاتي!');
      return;
    }
    
    addWeeklyReview({
      weekStartDate: Date.now() - (7 * 24 * 60 * 60 * 1000),
      weekEndDate: Date.now(),
      pnl: currentStats.pnl,
      winRate: currentStats.winRate,
      tradesCount: currentStats.tradesCount,
      whatWentWell,
      whatWentWrong,
      focusNextWeek
    });

    setIsFormOpen(false);
    setWhatWentWell('');
    setWhatWentWrong('');
    setFocusNextWeek('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & CTA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-l from-indigo-900 to-indigo-800 rounded-3xl p-6 shadow-md text-white">
        <div>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300"/>
            المراجعة الدورية الأسبوعية
          </h2>
          <p className="text-xs text-indigo-200 font-bold max-w-lg leading-relaxed">
            المتداول المحترف لا يقيس نجاحه بصفقة واحدة، بل بالاستمرارية. خصص وقتاً كل أسبوع لمراجعة أدائك بموضوعية، تدوين ما تعلمته، وضبط التركيز للأسبوع القادم.
          </p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="shrink-0 px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-black text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            بدء مراجعة هذا الأسبوع
          </button>
        )}
      </div>

      {/* Form (If Open) */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 border-b border-indigo-100 dark:border-indigo-900/50">
            <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300">نموذج التقييم الذاتي للأسبوع المنقضي</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Auto Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500">صفقات مغلقة هذا الأسبوع</span>
                <div className="text-xl font-black text-slate-800 dark:text-white font-mono-num">{currentStats.tradesCount}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500">صافي الربح / الخسارة</span>
                <div className={\`text-xl font-black font-mono-num \${currentStats.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                  {currentStats.pnl > 0 ? '+' : ''}{formatEGP(currentStats.pnl)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500">نسبة الصفقات الرابحة</span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono-num" dir="ltr">
                  {currentStats.winRate.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 mb-2">
                  <CheckCircle className="w-4 h-4" /> ما الذي قمت به بشكل صحيح هذا الأسبوع؟ (نقاط القوة)
                </label>
                <textarea 
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder="مثال: التزمت بوقف الخسارة تماماً، ولم أطارد الأسهم المرتفعة..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-400 mb-2">
                  <AlertOctagon className="w-4 h-4" /> ما هي الأخطاء التي وقعت فيها؟ (التحديات)
                </label>
                <textarea 
                  value={whatWentWrong}
                  onChange={(e) => setWhatWentWrong(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                  placeholder="مثال: بعت إحدى الصفقات الرابحة مبكراً بسبب الخوف، وضيعت ربحاً كبيراً..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black text-blue-700 dark:text-blue-400 mb-2">
                  <Target className="w-4 h-4" /> ما هو تركيزي وهدفي للأسبوع القادم؟
                </label>
                <textarea 
                  value={focusNextWeek}
                  onChange={(e) => setFocusNextWeek(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="مثال: التركيز على قطاع البنوك، وعدم الدخول إلا بشروط القائمة (Score >= 8)..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
              >
                حفظ المراجعة الأسبوعية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">سجل المراجعات السابقة</h3>
        
        {weeklyReviews.length === 0 && !isFormOpen && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا يوجد أي مراجعات محفوظة. ابدأ بتسجيل مراجعتك الأولى!</p>
          </div>
        )}

        {weeklyReviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5 transition-hover hover:shadow-md">
            
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                الأسبوع المنتهي في {new Date(review.weekEndDate).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono-num font-black">
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">{review.tradesCount} صفقة</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={\`px-3 py-1.5 rounded-lg \${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}\`} dir="ltr">
                  {review.pnl > 0 ? '+' : ''}{formatEGP(review.pnl)}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> الإيجابيات
                </h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-handwriting text-sm">{review.whatWentWell}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-500 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> الأخطاء
                </h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-handwriting text-sm">{review.whatWentWrong}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-blue-700 dark:text-blue-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> التركيز القادم
                </h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-handwriting text-sm">{review.focusNextWeek}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}
`;
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', content, 'utf8');
console.log("Created WeeklyReviewTab");
