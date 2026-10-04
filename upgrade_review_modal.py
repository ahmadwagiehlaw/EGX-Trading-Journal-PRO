# -*- coding: utf-8 -*-
with open('src/components/WeeklyReviewModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
old_states = """  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');"""

new_states = """  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');
  const [disciplineScore, setDisciplineScore] = useState<number>(3);
  const [marketCondition, setMarketCondition] = useState<'bull' | 'bear' | 'sideways' | 'volatile'>('bull');"""

content = content.replace(old_states, new_states)

# Add set states in useEffect
old_use_effect = """        setWhatWentWell(reviewToEdit.whatWentWell);
        setWhatWentWrong(reviewToEdit.whatWentWrong);
        setFocusNextWeek(reviewToEdit.focusNextWeek);
      } else {
        setEndDate(new Date().toISOString().split('T')[0]);
        setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setWhatWentWell('');
        setWhatWentWrong('');
        setFocusNextWeek('');
      }"""

new_use_effect = """        setWhatWentWell(reviewToEdit.whatWentWell);
        setWhatWentWrong(reviewToEdit.whatWentWrong);
        setFocusNextWeek(reviewToEdit.focusNextWeek);
        setDisciplineScore(reviewToEdit.disciplineScore || 3);
        setMarketCondition(reviewToEdit.marketCondition || 'bull');
      } else {
        setEndDate(new Date().toISOString().split('T')[0]);
        setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setWhatWentWell('');
        setWhatWentWrong('');
        setFocusNextWeek('');
        setDisciplineScore(3);
        setMarketCondition('bull');
      }"""

content = content.replace(old_use_effect, new_use_effect)

# Update payload
old_payload = """      const payload = {
        weekStartDate: new Date(startDate).getTime(),
        weekEndDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1),
        pnl: currentStats.pnl,
        winRate: currentStats.winRate,
        tradesCount: currentStats.closedCount,
        openedCount: currentStats.openedCount,
        closedCount: currentStats.closedCount,
        whatWentWell,
        whatWentWrong,
        focusNextWeek,
      };"""

new_payload = """      const payload = {
        weekStartDate: new Date(startDate).getTime(),
        weekEndDate: new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1),
        pnl: currentStats.pnl,
        winRate: currentStats.winRate,
        tradesCount: currentStats.closedCount,
        openedCount: currentStats.openedCount,
        closedCount: currentStats.closedCount,
        whatWentWell,
        whatWentWrong,
        focusNextWeek,
        disciplineScore,
        marketCondition,
      };"""

content = content.replace(old_payload, new_payload)

# Add UI for Discipline and Market Condition
old_questions_start = """          {/* Questions */}
          <div className="space-y-4">"""

new_questions_start = """          {/* Strategy & Psych Options */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <label className="block text-[10px] font-bold text-slate-500 mb-2">حالة السوق</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'bull', label: 'صاعد 🐂', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
                  { id: 'bear', label: 'هابط 🐻', color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
                  { id: 'sideways', label: 'عرضي ↔️', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                  { id: 'volatile', label: 'متذبذب ⚡', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMarketCondition(m.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${marketCondition === m.id ? m.color + ' ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-700' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <label className="block text-[10px] font-bold text-slate-500 mb-2">تقييم الانضباط (1 - 5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => setDisciplineScore(score)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${disciplineScore >= score ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">"""

content = content.replace(old_questions_start, new_questions_start)

with open('src/components/WeeklyReviewModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Modal")
