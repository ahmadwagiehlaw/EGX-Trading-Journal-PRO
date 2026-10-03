const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const coreUI = `
            {/* Core / Satellite Advanced Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">توزيع التمركز (Core vs Satellite)</span>
                </div>
                {isEditingCoreShares ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-black px-2 py-1 outline-none text-center shadow-inner"
                      value={coreSharesInput}
                      onChange={e => setCoreSharesInput(e.target.value)}
                      autoFocus
                      dir="ltr"
                    />
                    <button onClick={handleSaveCoreShares} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"><CheckCircle className="w-4 h-4"/></button>
                    <button onClick={() => setIsEditingCoreShares(false)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingCoreShares(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <Pencil className="w-3 h-3" />
                    تعديل الكور
                  </button>
                )}
              </div>
              
              {/* Progress Bar Split */}
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden shadow-inner mt-4 mb-2 relative">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-center relative overflow-hidden"
                  style={{ width: \`\${position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0}%\` }}
                  title="أسهم الكور (Core)"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                </div>
                <div 
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: \`\${100 - (position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0)}%\` }}
                  title="أسهم الساتلايت (Satellite)"
                />
              </div>
              
              <div className="flex justify-between items-center text-xs font-black">
                <div className="text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  الكور: {position?.coreShares || 0} سهم 
                  <span className="opacity-60">({((position?.coreShares || 0) / metrics!.openShares * 100).toFixed(0)}%)</span>
                </div>
                <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  الساتلايت: {metrics!.openShares - (position?.coreShares || 0)} سهم
                  <span className="opacity-60">({(100 - ((position?.coreShares || 0) / metrics!.openShares * 100)).toFixed(0)}%)</span>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                </div>
              </div>
              
              {(!position?.coreShares || position.coreShares === 0) && (
                <p className="text-[10px] font-bold text-slate-500 mt-3 text-center bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg">
                  💡 نصيحة: حدد أسهم الكور (Core) الخاصة بك لحمايتها من قرارات البيع العاطفية أثناء التذبذب السعري.
                </p>
              )}
            </div>
`;

const txRegex = /\{\/\* Quick Partial Transactions Row \*\/\}/;
code = code.replace(txRegex, match => coreUI + '\n\n' + match);

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Injected Beautiful Core/Satellite Bar!");
