const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const corePanelCode = `
            {/* Core & Satellite Breakdown — Investment positions only */}
            {position!.portfolioType === 'investment' && metrics!.isOpen && (() => {
              const coreShares = position!.coreShares !== undefined
                ? Math.min(position!.coreShares, metrics!.openShares)
                : 0;
              const satShares = Math.max(0, metrics!.openShares - coreShares);
              const coreCapital = coreShares * metrics!.avgEntry;
              const satCapital = satShares * metrics!.avgEntry;
              const totalCapital = coreCapital + satCapital;
              const corePercent = totalCapital > 0 ? (coreCapital / totalCapital) * 100 : 0;

              return (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400">توزيع Core & Satellite</span>
                    <button
                      onClick={() => { setIsEditingCoreShares(!isEditingCoreShares); setCoreSharesInput(coreShares.toString()); }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isEditingCoreShares ? 'إلغاء' : 'تعديل كمية Core'}
                    </button>
                  </div>
                  {isEditingCoreShares && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 shrink-0">Core سهم:</span>
                      <input
                        type="number" min={0} max={metrics!.openShares} step={1}
                        value={coreSharesInput}
                        onChange={e => setCoreSharesInput(e.target.value)}
                        className="w-24 text-center px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-black text-sm outline-none"
                        dir="ltr"
                        autoFocus
                        placeholder="0"
                      />
                      <span className="text-xs text-slate-400 shrink-0">من {metrics!.openShares.toLocaleString()}</span>
                      <button
                        onClick={handleSaveCoreShares}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1.5 rounded-lg text-xs transition-all"
                      >
                        حفظ
                      </button>
                    </div>
                  )}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full flex">
                      <div className="bg-indigo-500 transition-all duration-500" style={{ width: \`\${Math.min(100, corePercent)}%\` }} />
                      <div className="bg-amber-400 transition-all duration-500" style={{ width: \`\${Math.min(100, 100 - corePercent)}%\` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400">🏛 Core: {coreShares.toLocaleString()} سهم ({corePercent.toFixed(0)}%)</span>
                    <span className="text-amber-600 dark:text-amber-400">🛰 Satellite: {satShares.toLocaleString()} سهم</span>
                  </div>
                </div>
              );
            })()}`;

const anchor = "{/* Quick Partial Transactions Row */}";
at = at.replace(anchor, corePanelCode + "\n\n          " + anchor);
fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('✓ Core & Satellite panel inserted');
