const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tStart = at.indexOf('<div className="overflow-x-auto">');
const tEnd = tStart; // We will just insert before it

const openLotsUI = `
               {metrics?.openLots && metrics.openLots.length > 0 && (
                 <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">تفصيل دفعات التمركز الحالية (Open Lots)</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">يفكك وهم المتوسطات</span>
                    </div>
                    <div className="space-y-2">
                       {metrics.openLots.map((lot, idx) => {
                          const lotProfit = (position!.currentMarketPrice || lot.price) - lot.price;
                          const lotProfitPercent = (lotProfit / lot.price) * 100;
                          return (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                               <div className="flex gap-4 items-center">
                                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold px-2.5 py-1 rounded-md text-xs">دفعة #{idx+1}</span>
                                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                     <span className="text-slate-900 dark:text-white font-black text-xs mx-1">{lot.shares.toLocaleString()}</span>سهم
                                     <span className="mx-1">منذ</span>
                                     <span className="text-slate-900 dark:text-white font-bold text-xs">{new Date(lot.date).toLocaleDateString('en-GB')}</span>
                                     <span className="mx-2">— التكلفة:</span> 
                                     <span className="text-slate-900 dark:text-white font-black text-xs">{lot.price.toFixed(2)}</span>
                                  </div>
                               </div>
                               <div className={\`text-xs font-black flex items-center gap-1 \${lotProfitPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                                  {lotProfitPercent > 0 ? '+' : ''}{lotProfitPercent.toFixed(1)}%
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               )}
               `;

at = at.slice(0, tStart) + openLotsUI + at.slice(tEnd);

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log("Added Open Lots UI");
