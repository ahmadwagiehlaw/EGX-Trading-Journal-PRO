p='src/components/ActiveTrades.tsx'
s=open(p,encoding='utf-8',newline='').read().replace('\r\n','\n')

# 1) shares column + unrealized chip underneath
a=s.index('                <div className="text-left">\n                  <p className="text-slate-400 font-bold text-xs mb-0.5">')
b=s.index('              {/* Key Financial Metrics Strip */}')
shares='''                <div className="text-left flex flex-col items-start">
                  <p className="text-slate-400 font-bold text-xs mb-0.5">الكمية المفتوحة</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{metrics!.openShares.toLocaleString()} <span className="text-lg">سهم</span></p>
                  {metrics!.isOpen && (() => {
                    const u = metrics!.netUnrealizedPnL;
                    const cost = metrics!.openShares * metrics!.avgEntry;
                    const uPct = cost > 0 ? (u / cost) * 100 : 0;
                    const tone = u > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                      : u < 0 ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'
                      : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
                    return (
                      <div className={`mt-1.5 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-black ${tone}`} title={u < 0 ? 'خسارة غير محققة (صافي بعد العمولات)' : 'ربح غير محقق (صافي بعد العمولات)'}>
                        {u < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        <span className="font-bold opacity-80">{u < 0 ? 'خسارة غير محققة' : 'ربح غير محقق'}</span>
                        <span dir="ltr">{u > 0 ? '+' : ''}{fmtCompact(u)} ({u > 0 ? '+' : ''}{uPct.toFixed(1)}%)</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

'''
s=s[:a]+shares+s[b:]

# 2) strip: single-line cells with icons
c=s.index('              {/* Key Financial Metrics Strip */}')
d=s.index('})()}',c)+len('})()}')
strip='''              {/* Key Financial Metrics Strip */}
              {metrics!.isOpen && (() => {
                const totalCost = metrics!.openShares * metrics!.avgEntry;
                const marketValue = metrics!.openShares * metrics!.currentPrice;
                const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
                let realizedPct = 0;
                if ((metrics! as any).totalSold > 0) {
                  const revenue = (metrics! as any).totalSold * (metrics! as any).avgExit;
                  const costOfSold = revenue - metrics!.realizedPnL;
                  if (costOfSold > 0) realizedPct = (metrics!.netRealizedPnL / costOfSold) * 100;
                }
                const rp = metrics!.netRealizedPnL;
                const rTone = rp > 0 ? 'text-emerald-600 dark:text-emerald-400' : rp < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300';
                return (
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex flex-col gap-1 min-w-0 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 whitespace-nowrap"><Wallet className="w-3 h-3 text-slate-400" />التكلفة</span>
                      <div className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{fmtCompact(totalCost)}</span>
                        {costPct > 0 && <span className="text-[10px] font-bold text-slate-400" dir="ltr">({costPct.toFixed(1)}%)</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 whitespace-nowrap"><Landmark className="w-3 h-3 text-blue-400" />القيمة السوقية</span>
                      <div className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{fmtCompact(marketValue)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 whitespace-nowrap"><Banknote className="w-3 h-3 text-emerald-400" />الربح المحقق</span>
                      <div className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className={`text-sm font-black ${rTone}`} dir="ltr">{rp > 0 ? '+' : ''}{fmtCompact(rp)}</span>
                        {(metrics! as any).totalSold > 0 && <span className={`text-[10px] font-bold ${rTone} opacity-80`} dir="ltr">({realizedPct > 0 ? '+' : ''}{realizedPct.toFixed(1)}%)</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}'''
s=s[:c]+strip+s[d:]
open(p,'w',encoding='utf-8',newline='').write(s.replace('\n','\r\n'))
print('ok')
