# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add RSI Pill
old_pill = """                  {/* ATR Pill */}
                  {metrics!.isOpen && (
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
                          placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
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
                        {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}"""

new_pill = """                  {/* ATR Pill */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingAtr(!isEditingAtr); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); }}
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
                          placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateAtr}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-purple-800 dark:text-purple-200 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); }}
                        dir="ltr"
                        title="انقر لتعديل ATR"
                      >
                        {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* RSI Pill */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingRsi(!isEditingRsi); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة RSI"
                    >
                      RSI:
                    </button>
                    {isEditingRsi ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={rsiInput}
                          onChange={(e) => setRsiInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-indigo-900 dark:text-indigo-100"
                          dir="ltr"
                          autoFocus
                          placeholder={((position!.plan?.rsi || 0)).toFixed(1)}
                        />
                        <button 
                          onClick={handleUpdateRsi}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-indigo-800 dark:text-indigo-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingRsi(true); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل RSI"
                      >
                        {((position!.plan?.rsi || 0)).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  )}"""

content = content.replace(old_pill, new_pill)

start_str = '{/* Trailing Stop Metrics Cards */}'
end_str = '{/* Smart Trailing Stop Tools */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_cards = """{/* Targets and Supports */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-100 dark:border-emerald-800/50 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Target className="w-4 h-4" />
                    المستهدفات (Targets)
                  </div>
                  {isEditingTargets ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleUpdateTargets} className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">حفظ</button>
                      <button onClick={() => setIsEditingTargets(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingTargets(true)} className="text-[10px] font-bold text-emerald-600 hover:underline">تعديل</button>
                  )}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`t${i}`} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">T{i}</span>
                      {isEditingTargets ? (
                        <input
                          type="number" step="any"
                          value={i === 1 ? t1Input : i === 2 ? t2Input : t3Input}
                          onChange={(e) => i === 1 ? setT1Input(e.target.value) : i === 2 ? setT2Input(e.target.value) : setT3Input(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5"
                          dir="ltr"
                        />
                      ) : (
                        <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono-num">
                          {(i === 1 ? position!.plan?.target : i === 2 ? position!.plan?.targets?.[0] : position!.plan?.targets?.[1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-3 border-b border-blue-100 dark:border-blue-800/50 pb-2">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <ArrowDownToLine className="w-4 h-4" />
                    الدعوم (Supports)
                  </div>
                  {isEditingSupports ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleUpdateSupports} className="text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">حفظ</button>
                      <button onClick={() => setIsEditingSupports(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingSupports(true)} className="text-[10px] font-bold text-blue-600 hover:underline">تعديل</button>
                  )}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`s${i}`} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">S{i}</span>
                      {isEditingSupports ? (
                        <input
                          type="number" step="any"
                          value={i === 1 ? s1Input : i === 2 ? s2Input : s3Input}
                          onChange={(e) => i === 1 ? setS1Input(e.target.value) : i === 2 ? setS2Input(e.target.value) : setS3Input(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5"
                          dir="ltr"
                        />
                      ) : (
                        <span className="font-black text-blue-700 dark:text-blue-300 font-mono-num">
                          {(position!.plan?.supports?.[i-1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

</div>

            """
    content = content[:start_idx] + new_cards + content[end_idx:]

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced cards and pill')
