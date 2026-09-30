const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const oldHeaderRegex = /<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-3">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

const newHeader = `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل سعر السوق يدوياً"
                    >
                      سعر السوق:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-20 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            await handleUpdateMarketPrice();
                            setIsEditingMarketPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل السعر"
                      >
                        {metrics.currentPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Highest Price Pill (Trailing Stop) */}
                  {metrics.isOpen && (
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      title="تحديث أعلى سعر لتفعيل الوقف المتحرك"
                    >
                      <Lock className="w-3 h-3" />
                      أقصى سعر:
                    </button>
                    {isEditingHighestPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={newHighestPrice}
                          onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                          className="w-20 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            const success = await handleUpdateTrailingStop();
                            if (success) setIsEditingHighestPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                {error && isEditingHighestPrice && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block w-full max-w-sm">
                    {error}
                  </p>
                )}
              </div>`;

c = c.replace(oldHeaderRegex, newHeader);

// Now remove the old Trailing Stop section completely
const oldTrailingStopRegex = /\{\/\* Trailing Stop Adjustment Input \*\/\}\s*\{metrics\.isOpen && \([\s\S]*?\}\)\}/;
c = c.replace(oldTrailingStopRegex, "");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Applied new compact UI');
