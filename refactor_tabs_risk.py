# -*- coding: utf-8 -*-
import sys

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add 'risk' to the leftTab state type definition and change default to 'risk' or keep it 'advisor'
# User says "تبويب منفصل", let's keep advisor as default or maybe risk as default. Let's keep advisor.
old_state = "const [leftTab, setLeftTab] = useState<'advisor' | 'plan' | 'notes'>('advisor');"
new_state = "const [leftTab, setLeftTab] = useState<'advisor' | 'plan' | 'risk' | 'notes'>('advisor');"
content = content.replace(old_state, new_state)

# 2. Extract "Decision indicators strip" and "Relative Performance (Distance) Gauge"
idx_decision = content.find("{/* Decision indicators strip */}")
idx_tabs_header = content.find("{/* TABS HEADER */}")

if idx_decision == -1 or idx_tabs_header == -1:
    print("Could not find blocks")
    sys.exit(1)

# The content between idx_decision and idx_tabs_header contains both the 8 cards and the visual gauge.
# Wait, let's find the closing of the inner div before the tabs header to be safe!
idx_inner_div_close = content.rfind("</div>", idx_decision, idx_tabs_header)
if idx_inner_div_close == -1:
    print("Could not find inner div close")
    sys.exit(1)

# Actually, I injected `</div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}` in the previous refactor!
idx_close_inner = content.find("</div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}")
if idx_close_inner != -1:
    risk_content = content[idx_decision:idx_close_inner]
    
    # Remove it from its original place
    content = content[:idx_decision] + content[idx_close_inner:]
    
    # Add the 'risk' tab header button
    tabs_header_start = '          <div className="flex items-center gap-2 mt-8 mb-6 border-b border-slate-200 dark:border-slate-800">'
    idx_tabs = content.find(tabs_header_start)
    if idx_tabs != -1:
        # Find where to insert the risk button (after Advisor, before Plan)
        idx_plan_btn = content.find('<button onClick={() => setLeftTab(\'plan\')}', idx_tabs)
        risk_btn = """            <button onClick={() => setLeftTab('risk')} className={`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab === 'risk' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <TrendingUp className="w-4 h-4 inline-block ml-1" /> المخاطرة والأداء
            </button>\n"""
        content = content[:idx_plan_btn] + risk_btn + content[idx_plan_btn:]
        
    # Inject the RISK TAB content before NOTES TAB
    idx_notes_tab = content.find("{/* NOTES TAB */}")
    
    # Let's add explanations to the cards.
    # The cards are mapped like this:
    # {cards.map((c, i) => (
    #   <div key={i} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${tone[c.tone]} transition-all hover:scale-105 shadow-sm text-center`}>
    #     <span className="text-[10px] font-bold opacity-80 mb-1">{c.label}</span>
    #     <span className="text-sm font-black font-mono-num">{c.value}</span>
    #   </div>
    # ))}
    # I can add a small tooltip or explanatory subtitle. Actually, they have `c.hint`! I can render it.
    
    risk_content = risk_content.replace(
        '<span className="text-sm font-black font-mono-num">{c.value}</span>',
        '<span className="text-sm font-black font-mono-num" dir="ltr">{c.value}</span>\n                    {c.hint && <span className="text-[9px] font-bold opacity-60 mt-1 max-w-full truncate">{c.hint}</span>}'
    )
    
    risk_tab_html = """          {/* RISK TAB */}
          {leftTab === 'risk' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">مؤشرات المخاطرة والأداء المالي</h3>
                </div>
""" + risk_content.replace('mb-6', 'mb-2').replace('mt-4', 'mt-0') + """
              </div>
            </div>
          )}

"""
    content = content[:idx_notes_tab] + risk_tab_html + content[idx_notes_tab:]
    
    # Write back
    with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully moved Risk section to tab.")
else:
    print("Could not find the close inner div marker.")

