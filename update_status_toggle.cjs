const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// Find the plan status toggle buttons
const oldToggle = `                <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2">حالة الخطة</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(prev => prev ? {...prev, status: 'waiting'} : null)}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'waiting'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                    >
                      <span>⏳ قيد التجهيز</span>
                      <span className="text-[10px] opacity-80">(Setup)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(prev => prev ? {...prev, status: 'ready'} : null)}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'ready'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                    >
                      <span>🎯 جاهزة للتنفيذ</span>
                      <span className="text-[10px] opacity-80">(Trigger)</span>
                    </button>
                  </div>`;

const newToggle = `                <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2 flex justify-between items-center">
                    <span>حالة الخطة</span>
                    {calculateScore(selectedPlan) < 6 && (
                      <span className="text-[9px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">يجب أن تكون الجودة 6 فما فوق للتنفيذ</span>
                    )}
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(prev => prev ? {...prev, status: 'waiting'} : null)}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'waiting'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                    >
                      <span>⏳ قيد التجهيز</span>
                      <span className="text-[10px] opacity-80">(Setup)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (calculateScore(selectedPlan) >= 6) {
                          setSelectedPlan(prev => prev ? {...prev, status: 'ready'} : null);
                        }
                      }}
                      disabled={calculateScore(selectedPlan) < 6}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'ready'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : calculateScore(selectedPlan) < 6 
                            ? 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                      title={calculateScore(selectedPlan) < 6 ? "جودة الصفقة ضعيفة (أقل من 6). لا يمكن تفعيل الخطة." : "تفعيل الخطة"}
                    >
                      <span>{calculateScore(selectedPlan) < 6 ? '🔒' : '🎯'} جاهزة للتنفيذ</span>
                      <span className="text-[10px] opacity-80">(Trigger)</span>
                    </button>
                  </div>`;

wl = wl.replace(oldToggle, newToggle);
fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Replaced status toggle');
