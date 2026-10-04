# -*- coding: utf-8 -*-
with open('src/components/WeeklyReviewTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_pills = """              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono-num font-black">
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">صفقات {review.tradesCount} | فتح {(review as any).openedCount || 0}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={`px-3 py-1.5 rounded-lg ${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`} dir="ltr">"""

new_pills = """              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono-num font-black">
                
                {review.disciplineScore && (
                  <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg">
                    <span>انضباط:</span>
                    <span>{"⭐".repeat(review.disciplineScore)}</span>
                  </span>
                )}
                
                {review.marketCondition && (
                  <span className={`px-3 py-1.5 rounded-lg ${
                    review.marketCondition === 'bull' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                    review.marketCondition === 'bear' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 
                    review.marketCondition === 'sideways' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  }`}>
                    {review.marketCondition === 'bull' ? 'صاعد 🐂' : review.marketCondition === 'bear' ? 'هابط 🐻' : review.marketCondition === 'sideways' ? 'عرضي ↔️' : 'متذبذب ⚡'}
                  </span>
                )}

                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">صفقات {review.tradesCount} | فتح {(review as any).openedCount || 0}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={`px-3 py-1.5 rounded-lg ${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`} dir="ltr">"""

content = content.replace(old_pills, new_pills)

with open('src/components/WeeklyReviewTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Tab")
