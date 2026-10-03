const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// The Header
const headerStart = content.indexOf('<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">');
const headerEnd = content.indexOf('</div>', headerStart) + 6;
const newHeader = `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل السعر يدوياً"
                    >
                      السعر:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateMarketPrice}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
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
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
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
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateTrailingStop}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* ATR Pill */}
                  {metrics.isOpen && (
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingAtr(!isEditingAtr); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة ATR لحساب الوقف الميكانيكي"
                    >
                      ATR:
                    </button>
                    {isEditingAtr ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={atrInput}
                          onChange={(e) => setAtrInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-purple-900 dark:text-purple-100"
                          dir="ltr"
                          autoFocus
                          placeholder={((position.trailingStop?.atrAtEntry || position.plan?.atr || 0)).toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateAtr}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-purple-800 dark:text-purple-200 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل ATR"
                      >
                        {((position.trailingStop?.atrAtEntry || position.plan?.atr || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                {error && isEditingHighestPrice && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block w-full max-w-sm">
                    {error}
                  </p>
                )}`;
content = content.slice(0, headerStart) + newHeader + content.slice(headerEnd);

// The Chart Redesign
const chartStart = content.indexOf('{/* Plan vs Reality Visual Chart */}');
const chartEnd = content.indexOf('{/* Trailing Stop Metrics Cards */}');
const newChart = `{/* Plan vs Reality Visual Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-10 rounded-3xl border border-slate-200 dark:border-slate-700/60 mb-6 relative mt-6 shadow-inner">
              <div className={\`absolute -top-4 left-4 z-10 px-3 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 border shadow-sm \${
                metrics.realizedPnL > 0 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-300' 
                  : metrics.realizedPnL < 0 
                    ? 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-300' 
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }\`}>
                صافي الأرباح المحققة: {metrics.realizedPnL > 0 ? '+' : ''}{metrics.realizedPnL.toFixed(2)} EGP
              </div>
              
              <div className="relative h-16 w-full flex items-center mt-8 mb-4">
                {/* Track */}
                <div className="absolute w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full shadow-inner overflow-hidden">
                  {position.plan?.target && position.plan?.stop ? (
                    <div 
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 via-blue-400 to-rose-500 opacity-90"
                      style={{ width: '100%' }}
                    />
                  ) : null}
                </div>

                {/* Markers */}
                {position.plan?.target && position.plan?.stop ? (() => {
                  const minP = position.plan.stop;
                  const maxP = position.plan.target;
                  const range = maxP - minP;
                  const entryPercent = Math.max(0, Math.min(100, ((metrics.avgEntry - minP) / range) * 100));
                  const trailingStopPercent = Math.max(0, Math.min(100, ((currentStop - minP) / range) * 100));
                  const currentPercent = Math.max(0, Math.min(100, ((metrics.currentPrice - minP) / range) * 100));

                  return (
                    <>
                      {/* Initial Stop */}
                      <div className="absolute flex flex-col items-center -ml-4" style={{ left: '0%', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> الوقف</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{minP.toFixed(2)}</span>
                      </div>
                      
                      {/* Target */}
                      <div className="absolute flex flex-col items-center -mr-4" style={{ left: '100%', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Target className="w-3 h-3"/> الهدف</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{maxP.toFixed(2)}</span>
                      </div>

                      {/* Entry */}
                      <div className="absolute flex flex-col items-center -ml-2" style={{ left: \`\${entryPercent}%\`, bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">الدخول</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{metrics.avgEntry.toFixed(2)}</span>
                        <div className="w-0.5 h-4 bg-blue-500 absolute -bottom-4"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 absolute -bottom-5"></div>
                      </div>

                      {/* Trailing Stop */}
                      {currentStop > minP && (
                        <div className="absolute flex flex-col items-center -ml-2" style={{ left: \`\${trailingStopPercent}%\`, top: '100%', marginTop: '14px' }}>
                          <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900 absolute -top-5"></div>
                          <div className="w-0.5 h-4 bg-orange-500 absolute -top-4"></div>
                          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">وقف متحرك</span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{currentStop.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Current Price */}
                      <div className="absolute flex flex-col items-center -ml-2" style={{ left: \`\${currentPercent}%\`, top: '100%', marginTop: '14px' }}>
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 dark:bg-white border-2 border-white dark:border-slate-900 absolute -top-5"></div>
                          <div className="w-0.5 h-4 bg-slate-800 dark:bg-white absolute -top-4"></div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">السوق</span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{metrics.currentPrice.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })() : (
                  <div className="text-center w-full text-[10px] text-slate-500 font-bold mt-8">الخطة غير مكتملة (يرجى إضافة هدف ووقف)</div>
                )}
              </div>
            </div>

            `;
content = content.slice(0, chartStart) + newChart + content.slice(chartEnd);

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Phase 2 done');
