const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tStart = wl.indexOf('{/* Target and Stop Inputs */}');
if (tStart === -1) {
    console.log("Could not find Target and Stop Inputs");
    process.exit(1);
}
// Find the exact end string
const tEndStr = 'dir="ltr" \n                      placeholder="42.50"\n                    />\n                  </div>\n                </div>';
const tEndStr2 = 'dir="ltr" \r\n                      placeholder="42.50"\r\n                    />\r\n                  </div>\r\n                </div>';

let tEnd = wl.indexOf(tEndStr, tStart);
if (tEnd === -1) tEnd = wl.indexOf(tEndStr2, tStart);
if (tEnd === -1) {
    console.log("Could not find end of Target and Stop Inputs");
    process.exit(1);
}
const exactLength = (wl.indexOf(tEndStr) > -1) ? tEndStr.length : tEndStr2.length;
const oldStr = wl.slice(tStart, tEnd + exactLength);

const newStr = `{/* Target, Stop, and Time Stop Inputs */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">الأهداف (الأساسي إجباري، T2 و T3 اختياري)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" step="any"
                        value={selectedPlan.target || ''} 
                        onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value) || 0})} 
                        className="w-1/3 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-emerald-700 dark:text-emerald-500 outline-none text-center" 
                        dir="ltr" placeholder="T1" title="الهدف الأساسي (T1)"
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
                        dir="ltr" placeholder="T2" title="الهدف الإضافي (T2)"
                      />
                      <input 
                        type="number" step="any"
                        value={selectedPlan.targets?.[1] || ''} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newTargets = [...(selectedPlan.targets || [])];
                          if (newTargets.length === 0 && val > 0) newTargets.push(0);
                          if (val > 0) newTargets[1] = val; else if (newTargets.length > 1) newTargets.splice(1, 1);
                          setSelectedPlan({...selectedPlan, targets: newTargets});
                        }} 
                        className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-slate-600 dark:text-slate-400 outline-none text-center" 
                        dir="ltr" placeholder="T3" title="الهدف الإضافي (T3)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-red-100 dark:border-red-900/60">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الوقف (Stop)</label>
                      <input 
                        type="number" step="any"
                        value={selectedPlan.stop || ''} 
                        onChange={(e) => setSelectedPlan({...selectedPlan, stop: parseFloat(e.target.value) || 0})} 
                        className="w-full bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-red-700 dark:text-red-500 outline-none text-center" 
                        dir="ltr" placeholder="42.50"
                      />
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/60">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الوقف الزمني (أيام)</label>
                      <input 
                        type="number" step="1" min="1"
                        value={selectedPlan.timeStopDays || ''} 
                        onChange={(e) => setSelectedPlan({...selectedPlan, timeStopDays: parseInt(e.target.value) || undefined})} 
                        className="w-full bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-amber-700 dark:text-amber-500 outline-none text-center" 
                        dir="ltr" placeholder="مثال: 20" title="أقصى عدد أيام مسموح للاحتفاظ بالصفقة دون حركة"
                      />
                    </div>
                  </div>
                </div>`;

wl = wl.replace(oldStr, newStr);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Successfully replaced target inputs without duplicating');
