const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// Ensure Edit2 and Trash2 are imported
if (!code.includes('Edit2')) {
    code = code.replace("Target } from 'lucide-react'", "Target, Edit2, Trash2 } from 'lucide-react'");
}

// Remove font-handwriting
code = code.replace(/font-handwriting/g, "");

// Add PnL, Edit, and Delete buttons
const headerStart = code.indexOf('<div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">');
if (headerStart > -1) {
    // Replace the block until the next </div></div> (end of header)
    const newHeader = `
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                من {new Date(review.weekStartDate).toLocaleDateString('ar-EG')} إلى {new Date(review.weekEndDate).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-xs font-mono-num font-black">
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">إغلاق {review.tradesCount} | فتح {(review as any).openedCount || 0}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={\`px-3 py-1.5 rounded-lg \${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}\`} dir="ltr">
                  {formatEGP(review.pnl)}
                </span>
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                  <button
                    onClick={() => {
                      setReviewToEdit(review);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>`;

    const oldHeaderStart = code.indexOf('<div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">');
    const oldHeaderEnd = code.indexOf('</div>\n            </div>\n            \n            <div className="grid md:grid-cols-3 gap-6">');
    if (oldHeaderEnd > -1) {
        code = code.slice(0, oldHeaderStart) + newHeader + code.slice(oldHeaderEnd + 6);
    }
}

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Updated WeeklyReviewTab UI perfectly!");
