const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">\s*متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">\{metrics\.avgEntry\.toFixed\(2\)\} EGP<\/span>\s*<\/p>\s*<\/div>/, `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-3">
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
                      const btn = document.getElementById('savePriceBtn');
                      if (btn) {
                        const orig = btn.innerText;
                        btn.innerText = 'حُفظ';
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
              </div>`);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed header!');
