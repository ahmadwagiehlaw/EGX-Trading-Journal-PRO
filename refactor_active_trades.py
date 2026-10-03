# -*- coding: utf-8 -*-
import sys
import re

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
state_old = "  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');"
state_new = """  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');
  const [leftTab, setLeftTab] = useState<'advisor' | 'plan' | 'notes'>('advisor');
  const [stockNote, setStockNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);"""
content = content.replace(state_old, state_new)

# 2. Add handleUpdateNote
handler_old = "  const handleUpdateSupports = async () => {"
handler_new = """  const handleUpdateNote = async () => {
    if (!position) return;
    await updatePosition(position.id, { plan: { ...position.plan, makerPlan: stockNote } } as any);
    setIsEditingNote(false);
  };

  const handleUpdateSupports = async () => {"""
content = content.replace(handler_old, handler_new)

# 3. Add to useEffect
effect_old = "      if (isEditingSupports) {"
effect_new = """      if (!isEditingNote) setStockNote(position.plan?.makerPlan || '');
      if (isEditingSupports) {"""
content = content.replace(effect_old, effect_new)

# 4. Extract Smart Insights Panel from Right Pane
smart_insights_start = "{/* Smart Insights Panel (AI Advisor) */}"
action_buttons_start = "<div className=\"flex flex-wrap gap-2 mb-8\">"
idx1 = content.find(smart_insights_start)
idx2 = content.find(action_buttons_start)
if idx1 == -1 or idx2 == -1:
    print("Could not find smart insights block")
    sys.exit(1)

smart_insights_block = content[idx1:idx2]
# Remove from Right pane
content = content[:idx1] + content[idx2:]

# 5. Extract Targets and Supports, Core & Satellite, Smart Trailing
targets_start = "{/* Targets and Supports */}"
idx_raw_start = content.find("{analytics && metrics!.isOpen && (analytics.status === 'broken' || analytics.status === 'raise' || analytics.status === 'near' || analytics.planIssue) && (")

idx_pills = content.find("{/* Top Metrics Pills */}")
if idx_raw_start != -1 and idx_pills != -1:
    content = content[:idx_raw_start] + content[idx_pills:]


idx_t = content.find(targets_start)
if idx_t != -1:
    before_targets = content[:idx_t]
    after_targets = content[idx_t:]
    
    tabs_html = """{/* TABS HEADER */}
            <div className="flex items-center gap-4 mt-8 mb-6 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setLeftTab('advisor')} className={`pb-3 px-1 font-black text-sm border-b-2 transition-colors ${leftTab === 'advisor' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                المستشار الذكي
              </button>
              <button onClick={() => setLeftTab('plan')} className={`pb-3 px-1 font-black text-sm border-b-2 transition-colors ${leftTab === 'plan' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                إدارة الصفقة
              </button>
              <button onClick={() => setLeftTab('notes')} className={`pb-3 px-1 font-black text-sm border-b-2 transition-colors ${leftTab === 'notes' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                ملاحظات السهم
              </button>
            </div>

            {/* ADVISOR TAB */}
            {leftTab === 'advisor' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {insights.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-500 text-sm">لا توجد توصيات حالياً من المستشار الذكي.</p>
                  </div>
                )}
""" + smart_insights_block.replace('mb-8', 'mb-2') + """
              </div>
            )}

            {/* NOTES TAB */}
            {leftTab === 'notes' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-yellow-900 dark:text-yellow-500 text-sm flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      ملاحظات حول السهم
                    </h3>
                    {isEditingNote ? (
                      <div className="flex items-center gap-2">
                        <button onClick={handleUpdateNote} className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-black hover:bg-yellow-700 transition-colors shadow-sm">حفظ</button>
                        <button onClick={() => { setIsEditingNote(false); setStockNote(position!.plan?.makerPlan || ''); }} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors">إلغاء</button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingNote(true)} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg text-xs font-black transition-colors shadow-sm">تعديل الملاحظات</button>
                    )}
                  </div>
                  
                  {isEditingNote ? (
                    <textarea
                      value={stockNote}
                      onChange={(e) => setStockNote(e.target.value)}
                      placeholder="اكتب أفكارك وملاحظاتك الفنية أو الأخبار الخاصة بهذا السهم هنا..."
                      className="w-full bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-sm font-bold text-slate-700 dark:text-slate-300 min-h-[200px] focus:ring-2 focus:ring-yellow-500 outline-none leading-relaxed resize-none"
                    />
                  ) : (
                    <div className="bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-800 rounded-xl p-4 min-h-[200px]">
                      {stockNote ? (
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{stockNote}</p>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 pt-10">
                          <Pin className="w-8 h-8 mb-3" />
                          <p className="text-xs font-bold">لا توجد ملاحظات مسجلة.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PLAN TAB */}
            {leftTab === 'plan' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
"""
    
    idx_end = after_targets.rfind("  );\n}")
    if idx_end != -1:
        divs = after_targets[:idx_end].rsplit('</div>', 3)
        plan_content = '</div>'.join(divs[:-1])
        rest = '</div>' + divs[-1] + "  );\n}"
        content = before_targets + tabs_html + plan_content + "\n              </div>\n            )}\n" + rest
            
with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
