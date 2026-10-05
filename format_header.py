# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add activeCapital to destructuring
old_destructure = "const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats, capitalInvestment, capitalSpeculation, commissionRate } = useTrades();"
new_destructure = "const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats, capitalInvestment, capitalSpeculation, commissionRate, activeCapital } = useTrades();"
content = content.replace(old_destructure, new_destructure)

# Replace the formatting and add percentages in the header strip
old_strip = """              {/* Key Financial Metrics Strip */}
              {metrics!.isOpen && (
                <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                    <span className="text-[10px] font-bold text-slate-400">التكلفة الإجمالية</span>
                    <span className="text-sm font-black font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                      {(metrics!.openShares * metrics!.avgEntry).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                    <span className="text-[10px] font-bold text-slate-400">القيمة السوقية</span>
                    <span className="text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {(metrics!.openShares * metrics!.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">الربح المحقق (Net)</span>
                    <span className={`text-sm font-black font-mono-num ${metrics!.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                      {metrics!.netRealizedPnL > 0 ? '+' : ''}{metrics!.netRealizedPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                </div>
              )}"""

new_strip = """              {/* Key Financial Metrics Strip */}
              {metrics!.isOpen && (() => {
                const totalCost = metrics!.openShares * metrics!.avgEntry;
                const marketValue = metrics!.openShares * metrics!.currentPrice;
                const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                
                // Calculate Realized PnL % based on sold shares cost
                // We use any available sold shares data, or fallback to 0% if no sales yet
                let realizedPct = 0;
                if ((metrics! as any).totalSold > 0) {
                  const revenue = (metrics! as any).totalSold * (metrics! as any).avgExit;
                  const grossProfit = metrics!.realizedPnL;
                  const costOfSold = revenue - grossProfit;
                  if (costOfSold > 0) {
                    realizedPct = (metrics!.netRealizedPnL / costOfSold) * 100;
                  }
                }

                return (
                  <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                      <span className="text-[10px] font-bold text-slate-500">التكلفة الإجمالية</span>
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="text-sm font-black font-mono-num text-slate-800 dark:text-slate-200" dir="ltr">
                          {totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                        </span>
                        {costPct > 0 && <span className="text-[10px] font-bold text-slate-400" dir="ltr">({costPct.toFixed(1)}%)</span>}
                      </div>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                      <span className="text-[10px] font-bold text-slate-500">القيمة السوقية</span>
                      <div className="flex items-baseline justify-end">
                        <span className="text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400" dir="ltr">
                          {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500">الربح المحقق</span>
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className={`text-sm font-black font-mono-num ${metrics!.netRealizedPnL > 0 ? 'text-emerald-600 dark:text-emerald-400' : metrics!.netRealizedPnL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`} dir="ltr">
                          {metrics!.netRealizedPnL > 0 ? '+' : ''}{metrics!.netRealizedPnL.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                        </span>
                        {((metrics! as any).totalSold > 0) && (
                          <span className={`text-[10px] font-bold ${metrics!.netRealizedPnL > 0 ? 'text-emerald-500' : metrics!.netRealizedPnL < 0 ? 'text-rose-500' : 'text-slate-400'}`} dir="ltr">
                            ({realizedPct > 0 ? '+' : ''}{realizedPct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}"""

content = content.replace(old_strip, new_strip)

# Also fix the % in RSI pill
content = content.replace("{((position!.plan?.rsi || 0)).toFixed(1)}%", "{((position!.plan?.rsi || 0)).toFixed(1)}")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated header and RSI pill")
