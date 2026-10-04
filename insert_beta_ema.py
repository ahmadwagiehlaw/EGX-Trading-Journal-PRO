# -*- coding: utf-8 -*-
import re
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

beta_ema_pills = """                  {/* Beta Pill */}
                  {metrics!.isOpen && (
                  <div 
                    className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                    onClick={() => { setIsEditingBeta(true); setIsEditingEma50(false); setIsEditingRsi(false); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                  >
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">بيتا:</span>
                    {isEditingBeta ? (
                        <input 
                          type="number" step="any"
                          value={betaInput}
                          onChange={(e) => setBetaInput(e.target.value)}
                          onBlur={handleUpdateBeta}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateBeta()}
                          className="w-14 bg-transparent text-xs font-black outline-none text-left text-amber-900 dark:text-amber-100 font-mono-num"
                          dir="ltr" autoFocus
                          placeholder={((position!.plan?.beta || 0)).toFixed(2)}
                        />
                    ) : (
                      <span className="text-xs font-black text-amber-800 dark:text-amber-200 font-mono-num" dir="ltr">
                        {position!.plan?.beta ? position!.plan.beta.toFixed(2) : '-'}
                      </span>
                    )}
                  </div>
                  )}

                  {/* EMA 50 Pill */}
                  {metrics!.isOpen && (
                  <div 
                    className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden shadow-sm px-2 py-1.5 cursor-text hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                    onClick={() => { setIsEditingEma50(true); setIsEditingBeta(false); setIsEditingRsi(false); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingFairValue(false); setIsEditingAnalystTarget(false); }}
                  >
                    <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">متوسط50:</span>
                    {isEditingEma50 ? (
                        <input 
                          type="number" step="any"
                          value={ema50Input}
                          onChange={(e) => setEma50Input(e.target.value)}
                          onBlur={handleUpdateEma50}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateEma50()}
                          className="w-14 bg-transparent text-xs font-black outline-none text-left text-orange-900 dark:text-orange-100 font-mono-num"
                          dir="ltr" autoFocus
                          placeholder={((position!.plan?.ema50 || 0)).toFixed(2)}
                        />
                    ) : (
                      <span className="text-xs font-black text-orange-800 dark:text-orange-200 font-mono-num" dir="ltr">
                        {position!.plan?.ema50 ? position!.plan.ema50.toFixed(2) : '-'}
                      </span>
                    )}
                  </div>
                  )}

"""

# Let's insert them right before Analyst Target
content = content.replace("                  {/* Analyst Target Pill */}", beta_ema_pills + "                  {/* Analyst Target Pill */}")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Inserted Beta & EMA correctly")
