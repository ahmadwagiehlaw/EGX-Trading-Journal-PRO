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

const targetStr = `                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">الهدف (Target)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={selectedPlan.target || ''} 
                      onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-emerald-700 dark:text-emerald-500 outline-none text-center" 
                      dir="ltr" 
                      placeholder="52.00"
                    />
                  </div>`;

const targetNewStr = `                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">الأهداف (الهدف الأساسي، ثم أهداف التخفيف T2, T3)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" step="any"
                        value={selectedPlan.target || ''} 
                        onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value) || 0})} 
                        className="w-1/3 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-emerald-700 dark:text-emerald-500 outline-none text-center" 
                        dir="ltr" placeholder="الأساسي (T1)" title="الهدف الأساسي (إجباري)"
                      />
                      <input 
                        type="number" step="any"
                        value={selectedPlan.targets?.[0] || ''} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTargets = [...(selectedPlan.targets || [])];
                          if (val > 0) newTargets[0] = val; else newTargets.splice(0, 1);
                          setSelectedPlan({...selectedPlan, targets: newTargets});
                        }} 
                        className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-slate-600 dark:text-slate-400 outline-none text-center" 
                        dir="ltr" placeholder="إضافي (T2)" title="الهدف الثاني (اختياري)"
                      />
                      <input 
                        type="number" step="any"
                        value={selectedPlan.targets?.[1] || ''} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTargets = [...(selectedPlan.targets || [])];
                          // Ensure T2 exists if we are setting T3
                          if (newTargets.length === 0 && val > 0) newTargets.push(0);
                          if (val > 0) newTargets[1] = val; else if (newTargets.length > 1) newTargets.splice(1, 1);
                          setSelectedPlan({...selectedPlan, targets: newTargets});
                        }} 
                        className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-slate-600 dark:text-slate-400 outline-none text-center" 
                        dir="ltr" placeholder="إضافي (T3)" title="الهدف الثالث (اختياري)"
                      />
                    </div>
                  </div>`;

wl = wl.replace(targetStr, targetNewStr);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Updated R:R and Targets in Watchlist');
