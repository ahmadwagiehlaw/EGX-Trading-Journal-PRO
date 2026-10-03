const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const mapStart = code.indexOf('weeklyReviews.map(review => (');
const mapEnd = code.indexOf('))}');

if (mapStart > -1 && mapEnd > -1) {
    const newMap = `weeklyReviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5 transition-all hover:shadow-md hover:-translate-y-1">
            
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                من {new Date(review.weekStartDate).toLocaleDateString('ar-EG')} إلى {new Date(review.weekEndDate).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono-num font-black">
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">إغلاق {review.tradesCount} | فتح {(review as any).openedCount || 0}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={\`px-3 py-1.5 rounded-lg \${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}\`} dir="ltr">
                  {review.pnl > 0 ? '+' : ''}{formatEGP(review.pnl)}
                </span>
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                  <button
                    onClick={() => {
                      setReviewToEdit(review);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> الإيجابيات
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.whatWentWell}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-500 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> التحديات والأخطاء
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.whatWentWrong}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-blue-700 dark:text-blue-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> التركيز القادم
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.focusNextWeek}</p>
              </div>
            </div>
            
          </div>
        `;
    code = code.slice(0, mapStart) + newMap + code.slice(mapEnd);
    
    // Ensure Edit2 is imported
    if (!code.includes('Edit2')) {
       code = code.replace("Target } from 'lucide-react'", "Target, Edit2 } from 'lucide-react'");
    }

    fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
    console.log("Fixed WeeklyReviewTab map completely");
} else {
    console.log("Could not find map block");
}
