p='src/components/ActiveTrades.tsx'
s=open(p,encoding='utf-8').read()
a="if (pnlPercent > 5 && riskPercent > 0) {"
assert a in s
s=s.replace(a,"if (pnlPercent > 5 && riskPercent > 0 && analytics?.status !== 'raise') {")
old="""                      <div className="flex items-baseline justify-end">
                        <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                          {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                        </span>
                      </div>"""
assert old in s
new="""                      <div className="flex items-baseline justify-end">
                        <span className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-200" dir="ltr">
                          {marketValue.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP
                        </span>
                      </div>
                      <div className={`mt-1 flex items-center justify-between gap-1 rounded-md px-1.5 py-0.5 ${unrealized > 0 ? 'bg-emerald-100/70 dark:bg-emerald-900/30' : unrealized < 0 ? 'bg-rose-100/70 dark:bg-rose-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{unrealized >= 0 ? 'ربح غير محقق' : 'خسارة غير محققة'}</span>
                        <span className={`text-[11px] font-black whitespace-nowrap ${unrealized > 0 ? 'text-emerald-700 dark:text-emerald-400' : unrealized < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}`} dir="ltr">
                          {unrealized > 0 ? '+' : ''}{unrealized.toLocaleString(undefined, {maximumFractionDigits: 0})} ({unrealizedPct > 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)
                        </span>
                      </div>"""
s=s.replace(old,new)
b="const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;"
assert b in s
s=s.replace(b,b+"\n                const unrealized = marketValue - totalCost;\n                const unrealizedPct = totalCost > 0 ? (unrealized / totalCost) * 100 : 0;")
open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
