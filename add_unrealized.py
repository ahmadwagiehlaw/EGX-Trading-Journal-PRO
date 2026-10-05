# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add unrealizedPct calculation
old_calc = """                  const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                  
                  // Calculate Realized PnL % based on sold shares cost"""

new_calc = """                  const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                  const unrealizedPct = totalCost > 0 ? (metrics!.netUnrealizedPnL / totalCost) * 100 : 0;
                  
                  // Calculate Realized PnL % based on sold shares cost"""

content = content.replace(old_calc, new_calc)


# Add UI
old_ui = """                      <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                        <span className="text-[10px] font-bold text-slate-500">القيمة السوقية</span>
                        <div className="flex items-baseline justify-end">
                          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                        </div>
                      </div>"""

new_ui = """                      <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                        <span className="text-[10px] font-bold text-slate-500">القيمة السوقية</span>
                        <div className="flex items-baseline justify-end">
                          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                        </div>
                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                          <span className={`text-[10px] font-bold tracking-tight ${metrics!.netUnrealizedPnL > 0 ? 'text-emerald-500' : metrics!.netUnrealizedPnL < 0 ? 'text-rose-500' : 'text-slate-400'}`} dir="ltr">
                            {metrics!.netUnrealizedPnL > 0 ? '+' : ''}{metrics!.netUnrealizedPnL.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                          <span className={`text-[9px] font-bold ${metrics!.netUnrealizedPnL > 0 ? 'text-emerald-500/80' : metrics!.netUnrealizedPnL < 0 ? 'text-rose-500/80' : 'text-slate-400/80'}`} dir="ltr">
                            ({metrics!.netUnrealizedPnL > 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>"""

# Fallback string if arabic causes an issue:
old_ui_safe = """                      <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 
last:pl-0">
                        <span className="text-[10px] font-bold text-slate-500">?????? ???????</span>
                        <div className="flex items-baseline justify-end">
                          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" 
dir="ltr">
                            {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                        </div>
                      </div>"""
old_ui_safe = old_ui_safe.replace("?????? ???????", "القيمة السوقية").replace("\nlast:pl-0", "last:pl-0")

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    print("Found exact block, replaced UI.")
else:
    import re
    # use regex
    match = re.search(r'<div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">.*?\{marketValue\.toLocaleString.*?</div>\s*</div>', content, re.DOTALL)
    if match:
        content = content.replace(match.group(0), new_ui)
        print("Found with regex, replaced UI.")
    else:
        print("COULD NOT FIND BLOCK")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

