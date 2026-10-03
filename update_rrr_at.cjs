const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const anchor = `                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)} EGP</span>
                </p>`;

const replaceStr = `                <div className="flex items-center gap-3 mt-1 mb-2 flex-wrap">
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                    متوسط الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)}</span>
                  </p>
                  {position!.plan?.target && position!.plan?.stop && (() => {
                    const r = position!.plan.target - metrics!.avgEntry;
                    const s = metrics!.avgEntry - position!.plan.stop;
                    const rrr = s > 0 ? (r / s).toFixed(2) : '0.00';
                    const numRRR = parseFloat(rrr);
                    return (
                      <div className="flex items-center gap-1.5 text-[10px] font-black border px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">R:R</span>
                        <span className={numRRR >= 2 ? 'text-emerald-600 dark:text-emerald-400' : numRRR > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                          1 : {rrr}
                        </span>
                        {numRRR < 2 && numRRR > 0 && (
                          <span className="text-rose-500 ml-1" title="العائد للمخاطرة ضعيف">⚠️</span>
                        )}
                      </div>
                    );
                  })()}
                </div>`;

at = at.replace(anchor, replaceStr);
fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('✓ Added RRR to ActiveTrades header');
