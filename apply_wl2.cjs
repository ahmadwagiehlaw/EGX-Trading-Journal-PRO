const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const rrrStr = `                {/* Live RRR & Max Shares Auto-Calculation */}
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <label className="text-xs font-black text-slate-600 dark:text-slate-300">نسبة المخاطرة للعائد (RRR)</label>
                    <span className="font-black text-base text-slate-900 dark:text-white font-mono-num" dir="ltr">
                      1 : {calculateRRR(selectedPlan)}
                    </span>
                  </div>`;

const rrrNewStr = `                {/* Live RRR & Max Shares Auto-Calculation */}
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <label className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      نسبة المخاطرة للعائد (RRR)
                      {parseFloat(calculateRRR(selectedPlan)) < 2 && parseFloat(calculateRRR(selectedPlan)) > 0 && (
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-bold">ضعيفة (أقل من 1:2)</span>
                      )}
                    </label>
                    <span className={\`font-black text-base font-mono-num \${parseFloat(calculateRRR(selectedPlan)) >= 2 ? 'text-emerald-600 dark:text-emerald-400' : parseFloat(calculateRRR(selectedPlan)) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}\`} dir="ltr">
                      1 : {calculateRRR(selectedPlan)}
                    </span>
                  </div>`;

wl = wl.replace(rrrStr, rrrNewStr);
fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
