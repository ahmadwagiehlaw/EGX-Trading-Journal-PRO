import sys

with open('src/components/TradesJournal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

cards_start = -1
cards_end = -1

for i, line in enumerate(lines):
    if "viewMode === 'cards'" in line:
        cards_start = i
    if "VIEW 2: PROFESSIONAL COMPACT FINANCIAL TABLE" in line:
        # The cards view must end a few lines before VIEW 2
        cards_end = i - 3
        break

if cards_start == -1 or cards_end == -1:
    print("Could not find boundaries")
    sys.exit(1)

new_cards_view = """      ) : viewMode === 'cards' ? (
        /* ========================================================
           VIEW 1: SMART GRID CARDS (Compact Icons)
           ======================================================== */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 xl:gap-5">
          {filteredPositions.map((pos) => {
            const metrics = computePositionMetrics(pos);
            const stockInfo = getStockBySymbol(pos.symbol);
            const sectorInfo = getSectorInfo(stockInfo?.sector || (pos.plan as any)?.sector);
            const SectorIcon = sectorInfo.Icon;
            const isRuleBreaker = pos.journal?.isRuleBreaker;

            return (
              <div 
                key={pos.id}
                onClick={() => setSelectedTradeId(pos.id)}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col relative group ${
                  metrics.isOpen 
                    ? 'border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-500' 
                    : metrics.realizedPnL > 0 
                      ? 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-500' 
                      : metrics.realizedPnL < 0 
                        ? 'border-rose-200/90 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Status Indicator Bar at the Top */}
                <div className={`h-1.5 w-full ${metrics.isOpen ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : metrics.realizedPnL > 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : metrics.realizedPnL < 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-slate-400'}`} />

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {/* Avatar and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      isRuleBreaker 
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 text-amber-800 dark:text-amber-300' 
                        : metrics.isOpen
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-400/50 text-white shadow-blue-500/20'
                          : metrics.realizedPnL > 0 
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-500 border-emerald-400/50 text-white shadow-emerald-500/20' 
                            : metrics.realizedPnL < 0
                              ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400/50 text-white shadow-rose-500/20'
                              : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-white'
                    }`}>
                      <SectorIcon className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isRuleBreaker && (
                        <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 p-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50" title="مخالفة للقواعد (3MS)">
                          <ShieldAlert className="w-4 h-4" />
                        </span>
                      )}
                      {!metrics.isOpen && (
                        <span className={`p-1.5 rounded-xl border ${metrics.realizedPnL > 0 ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'}`}>
                          {metrics.realizedPnL > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Symbol & Name */}
                  <div className="mb-5">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5" dir="ltr">
                      {pos.symbol}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">
                      {stockInfo?.nameAr || pos.plan?.strategy || 'تمركز'}
                    </p>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">سعر الدخول</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                        {metrics.avgEntry.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الكمية</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono-num" dir="ltr">
                        {metrics.openShares}
                      </span>
                    </div>
                  </div>

                  {/* Profit / Loss or Target */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {metrics.isOpen ? 'الهدف / الوقف' : 'الربح المحقق'}
                    </span>
                    {metrics.isOpen ? (
                      <div className="flex items-center gap-1.5 font-mono-num font-black text-xs" dir="ltr">
                        <span className="text-rose-500">{metrics.currentStop.toFixed(2)}</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-emerald-500">{pos.plan?.target ? pos.plan.target.toFixed(2) : '—'}</span>
                      </div>
                    ) : (
                      <span className={`text-sm font-black font-mono-num ${metrics.realizedPnL > 0 ? 'text-emerald-600 dark:text-emerald-400' : metrics.realizedPnL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`} dir="ltr">
                        {metrics.realizedPnL > 0 ? '+' : ''}{formatEGP(metrics.realizedPnL)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
"""

new_lines = lines[:cards_start] + [new_cards_view + '\n'] + lines[cards_end+1:]

with open('src/components/TradesJournal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Cards View successfully rewritten!")
