const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const oldHeader = `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
              </div>`;

const newHeader = `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-3">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-max">
                  <span className="text-[10px] font-bold text-slate-500 px-1">السعر:</span>
                  <input 
                    type="number"
                    step="any"
                    value={marketPriceInput}
                    onChange={(e) => setMarketPriceInput(e.target.value)}
                    placeholder={metrics.currentPrice.toFixed(2)}
                    className="w-20 text-xs font-black text-slate-900 dark:text-white py-1 px-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                    dir="ltr"
                  />
                  <button
                    onClick={async () => {
                      await handleUpdateMarketPrice();
                      // Visual feedback hack
                      const btn = document.getElementById('savePriceBtn');
                      if (btn) {
                        const orig = btn.innerText;
                        btn.innerText = 'تم حفظ';
                        btn.classList.add('bg-emerald-600');
                        setTimeout(() => { btn.innerText = orig; btn.classList.remove('bg-emerald-600'); }, 1500);
                      }
                    }}
                    id="savePriceBtn"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3 py-1 rounded text-[10px] transition-colors"
                  >
                    حفظ
                  </button>
                </div>
              </div>`;

c = c.replace(oldHeader, newHeader);

const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <p className="text-xs font-black text-rose-600 dark:text-rose-400 mb-1 flex items-center justify-center gap-1">أرباح/خسائر عائمة (Unrealized PnL)</p>
                <div className="flex items-center justify-center gap-2">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                    {metrics.netUnrealizedPnL >= 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)} EGP
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2 text-center">السعر (تحديث يدوي)</p>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="any"
                    value={marketPriceInput}
                    onChange={(e) => setMarketPriceInput(e.target.value)}
                    placeholder={metrics.currentPrice.toFixed(2)}
                    className="flex-1 text-sm font-black text-slate-900 dark:text-white py-2 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                    dir="ltr"
                  />
                  <button
                    onClick={handleUpdateMarketPrice}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
                  >
                    حفظ السعر
                  </button>
                </div>
              </div>
            </div>`;

const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Unrealized PnL (الأرباح العائمة) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">أرباح/خسائر عائمة (ورقية)</p>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netUnrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                    {metrics.netUnrealizedPnL >= 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)} EGP
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">بناءً على السعر الحالي ({metrics.currentPrice.toFixed(2)})</span>
                </div>
              </div>

              {/* Realized PnL (الأرباح المحققة) */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-0"></div>
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-center gap-1 relative z-10">الأرباح المحققة (فعلية)</p>
                <div className="flex flex-col items-center justify-center gap-1 relative z-10">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                    {metrics.netRealizedPnL >= 0 ? '+' : ''}{metrics.netRealizedPnL.toFixed(2)} EGP
                  </span>
                  <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-bold">
                    ناتجة عن إجمالي {position.transactions?.filter(t => t.type === 'sell').length || 0} عملية ביع و {metrics.totalSold.toLocaleString()} سهم
                  </span>
                </div>
              </div>
            </div>`;

c = c.replace(oldGrid, newGrid);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Modified UI layout');
