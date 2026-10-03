# -*- coding: utf-8 -*-
import re

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
if "const [leftTab," not in content:
    content = content.replace(
        "  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');",
        "  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');\n  const [leftTab, setLeftTab] = useState<'advisor' | 'plan' | 'notes'>('advisor');\n  const [stockNote, setStockNote] = useState('');\n  const [isEditingNote, setIsEditingNote] = useState(false);"
    )

# 2. Handler
if "const handleUpdateNote" not in content:
    content = content.replace(
        "  const handleUpdateSupports = async () => {",
        "  const handleUpdateNote = async () => {\n    if (!position) return;\n    await updatePosition(position.id, { plan: { ...position.plan, makerPlan: stockNote } } as any);\n    setIsEditingNote(false);\n  };\n\n  const handleUpdateSupports = async () => {"
    )

# 3. Effect
if "setStockNote(" not in content:
    content = content.replace(
        "      if (isEditingAtr) setAtrInput((position.trailingStop?.atrAtEntry || position.plan?.atr || 0).toString());",
        "      if (!isEditingNote) setStockNote(position.plan?.makerPlan || '');\n      if (isEditingAtr) setAtrInput((position.trailingStop?.atrAtEntry || position.plan?.atr || 0).toString());"
    )

# 4. Remove Smart Insights from Right Pane
smart_insights_start = "             {/* Smart Insights Panel (AI Advisor) */}"
idx_start = content.find(smart_insights_start)
idx_end = content.find('             <div className="flex flex-wrap gap-2 mb-8">')
smart_insights_html = ""
if idx_start != -1 and idx_end != -1:
    smart_insights_html = content[idx_start:idx_end]
    content = content[:idx_start] + content[idx_end:]

# 5. Remove Raw Alerts from Left Pane
raw_alerts_start = "{/* Stop status banners */}"
idx_raw = content.find(raw_alerts_start)
idx_pills = content.find("{/* Decision indicators strip */}")
if idx_raw != -1 and idx_pills != -1:
    content = content[:idx_raw] + content[idx_pills:]

# 6. Build the Tabs HTML for the Left Pane
if "{/* TABS HEADER */}" not in content:
    tabs_html = """          </div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}

          {/* TABS HEADER */}
          <div className="flex items-center gap-2 mt-8 mb-6 border-b border-slate-200 dark:border-slate-800">
            <button onClick={() => setLeftTab('advisor')} className={`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab === 'advisor' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Sparkles className="w-4 h-4 inline-block ml-1" /> المستشار الذكي
            </button>
            <button onClick={() => setLeftTab('plan')} className={`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab === 'plan' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Target className="w-4 h-4 inline-block ml-1" /> إدارة الصفقة
            </button>
            <button onClick={() => setLeftTab('notes')} className={`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab === 'notes' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Pencil className="w-4 h-4 inline-block ml-1" /> الملاحظات
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
""" + smart_insights_html.replace('mb-8', 'mb-2') + """
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
    
    # 7. Insert tabs_html right before `{/* Targets and Supports */}`
    targets_start = "            {/* Targets and Supports */}"
    idx_targets = content.find(targets_start)
    if idx_targets != -1:
        content = content[:idx_targets] + tabs_html + content[idx_targets:]
    else:
        print("Could not find Targets and Supports")
        exit(1)
        
    # 8. Remove the old closing div of the Inner Div
    bad_stray = """              </div>
            </div>

</div>

            {/* Smart Trailing Stop Tools */}"""
    good_stray = """              </div>
            </div>

            {/* Smart Trailing Stop Tools */}"""
    content = content.replace(bad_stray, good_stray)
    
    # 9. Wrap the end of the Plan Tab
    end_plan_start = '          {/* Quick Partial Transactions Row */}'
    idx_end_plan = content.find(end_plan_start)
    if idx_end_plan != -1:
        content = content[:idx_end_plan] + "            </div>\n          )}\n\n" + content[idx_end_plan:]
    else:
        print("Could not find end plan marker")
        exit(1)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Refactoring PERFECT complete.")
