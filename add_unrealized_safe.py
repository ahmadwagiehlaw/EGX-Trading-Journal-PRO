# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add unrealizedPct calculation
old_calc = """                  const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                  
                  // Calculate Realized PnL % based on sold shares cost"""

new_calc = """                  const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                  const unrealizedPct = totalCost > 0 ? (metrics!.netUnrealizedPnL / totalCost) * 100 : 0;
                  
                  // Calculate Realized PnL % based on sold shares cost"""

if old_calc in content:
    content = content.replace(old_calc, new_calc)
else:
    print("Could not find old_calc!")

# Add UI
old_ui = """                        <div className="flex items-baseline justify-end">
                          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                        </div>
                      </div>"""

new_ui = """                        <div className="flex items-baseline justify-end">
                          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                        </div>
                        {/* Unrealized PnL Row */}
                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                          <span className={`text-[10px] font-bold tracking-tight ${metrics!.netUnrealizedPnL > 0 ? 'text-emerald-500' : metrics!.netUnrealizedPnL < 0 ? 'text-rose-500' : 'text-slate-400'}`} dir="ltr">
                            {metrics!.netUnrealizedPnL > 0 ? '+' : ''}{metrics!.netUnrealizedPnL.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                          </span>
                          <span className={`text-[9px] font-bold ${metrics!.netUnrealizedPnL > 0 ? 'text-emerald-500/80' : metrics!.netUnrealizedPnL < 0 ? 'text-rose-500/80' : 'text-slate-400/80'}`} dir="ltr">
                            ({metrics!.netUnrealizedPnL > 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>"""

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    print("Replaced UI.")
else:
    print("COULD NOT FIND UI BLOCK")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

