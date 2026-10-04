# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">'
# We ONLY replace the grid block, up to the end of the grid block.
# The grid block ends right before the error block.
end_marker = '                {error && isEditingHighestPrice && ('

idx_start = content.find(start_marker)
idx_end = content.find(end_marker, idx_start)

if idx_start != -1 and idx_end != -1:
    new_pills_block = """<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
                    {/* Market Price Pill */}
                    <div 
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                    >
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">السوق:</span>
                      {isEditingMarketPrice ? (
                          <input 
                            type="number" step="any"
                            value={marketPriceInput}
                            onChange={(e) => setMarketPriceInput(e.target.value)}
                            onBlur={handleUpdateMarketPrice}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateMarketPrice()}
                            className="w-14 bg-transparent text-xs font-black outline-none text-left text-slate-900 dark:text-white font-mono-num"
                            dir="ltr" autoFocus
                            placeholder={metrics!.currentPrice.toFixed(2)}
                          />
                      ) : (
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono-num" dir="ltr">
                          {metrics!.currentPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
  
                    {/* Highest Price Pill (Trailing Stop) */}
                    {metrics!.isOpen && (
                    <div 
                      className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                    >
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap flex items-center gap-1">
                        <Lock className="w-3 h-3" /> القمة:
                      </span>
                      {isEditingHighestPrice ? (
                          <input 
                            type="number" step="any"
                            value={newHighestPrice}
                            onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                            onBlur={handleUpdateTrailingStop}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateTrailingStop()}
                            className="w-14 bg-transparent text-xs font-black outline-none text-left text-blue-900 dark:text-blue-100 font-mono-num"
                            dir="ltr" autoFocus
                            placeholder={currentHighest.toFixed(2)}
                          />
                      ) : (
                        <span className="text-xs font-black text-blue-800 dark:text-blue-200 font-mono-num" dir="ltr">
                          {currentHighest.toFixed(2)}
                        </span>
                      )}
                    </div>
                    )}
  
                    {/* ATR Pill */}
                    {metrics!.isOpen && (
                    <div 
                      className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                    >
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 whitespace-nowrap">ATR:</span>
                      {isEditingAtr ? (
                          <input 
                            type="number" step="any"
                            value={atrInput}
                            onChange={(e) => setAtrInput(e.target.value)}
                            onBlur={handleUpdateAtr}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateAtr()}
                            className="w-14 bg-transparent text-xs font-black outline-none text-left text-purple-900 dark:text-purple-100 font-mono-num"
                            dir="ltr" autoFocus
                            placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                          />
                      ) : (
                        <span className="text-xs font-black text-purple-800 dark:text-purple-200 font-mono-num" dir="ltr">
                          {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                        </span>
                      )}
                    </div>
                    )}

                    {/* RSI Pill */}
                    {metrics!.isOpen && (
                    <div 
                      className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      onClick={() => { setIsEditingRsi(true); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                    >
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">RSI:</span>
                      {isEditingRsi ? (
                          <input 
                            type="number" step="any"
                            value={rsiInput}
                            onChange={(e) => setRsiInput(e.target.value)}
                            onBlur={handleUpdateRsi}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateRsi()}
                            className="w-14 bg-transparent text-xs font-black outline-none text-left text-indigo-900 dark:text-indigo-100 font-mono-num"
                            dir="ltr" autoFocus
                            placeholder={((position!.plan?.rsi || 0)).toFixed(1)}
                          />
                      ) : (
                        <span className="text-xs font-black text-indigo-800 dark:text-indigo-200 font-mono-num" dir="ltr">
                          {((position!.plan?.rsi || 0)).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    )}

                  {/* Fair Value Pill */}
                  <div 
                    className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                    onClick={() => { setIsEditingFairValue(true); setIsEditingAnalystTarget(false); setIsEditingMarketPrice(false); setIsEditingHighestPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); }}
                  >
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">العادل:</span>
                    {isEditingFairValue ? (
                        <input 
                          type="number" step="any" 
                          value={fairValueInput} onChange={e => setFairValueInput(e.target.value)} 
                          onBlur={handleUpdateFairValue}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateFairValue()}
                          className="w-14 bg-transparent text-xs font-black outline-none text-left text-teal-900 dark:text-teal-100 font-mono-num" dir="ltr" autoFocus placeholder="-" 
                        />
                    ) : (
                      <span className="text-xs font-black text-teal-800 dark:text-teal-200 font-mono-num" dir="ltr">
                        {position!.plan?.fairValue ? position!.plan.fairValue.toFixed(2) : '-'}
                      </span>
                    )}
                  </div>

                  {/* Analyst Target Pill */}
                  <div 
                    className="flex items-center justify-between bg-fuchsia-50 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors"
                    onClick={() => { setIsEditingAnalystTarget(true); setIsEditingFairValue(false); setIsEditingMarketPrice(false); setIsEditingHighestPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); }}
                  >
                    <span className="text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 whitespace-nowrap">المحللين:</span>
                    {isEditingAnalystTarget ? (
                        <input 
                          type="number" step="any" 
                          value={analystTargetInput} onChange={e => setAnalystTargetInput(e.target.value)} 
                          onBlur={handleUpdateAnalystTarget}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateAnalystTarget()}
                          className="w-14 bg-transparent text-xs font-black outline-none text-left text-fuchsia-900 dark:text-fuchsia-100 font-mono-num" dir="ltr" autoFocus placeholder="-" 
                        />
                    ) : (
                      <span className="text-xs font-black text-fuchsia-800 dark:text-fuchsia-200 font-mono-num" dir="ltr">
                        {position!.plan?.analystTarget ? position!.plan.analystTarget.toFixed(2) : '-'}
                      </span>
                    )}
                  </div>

                </div>
"""
    
    content = content[:idx_start] + new_pills_block + content[idx_end:]
    
    with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Pills updated successfully!")
else:
    print("Could not find boundaries.")
