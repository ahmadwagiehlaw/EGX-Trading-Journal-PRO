const fs = require('fs');

let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const handleUpdateTrailingStop = async \(\): Promise<boolean> => \{[\s\S]*?return true;\n  \};/, `const handleUpdateTrailingStop = async (): Promise<boolean> => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(\`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (\${currentHighest.toFixed(2)} EGP).\`);
      return false;
    }

    const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;
    const finalStop = Math.max(calculatedNewStop, currentStop); // Clamp it, don't throw error

    setError(null);
    await updateTrailingStop(position.id, highest, finalStop);
    setNewHighestPrice('');
    return true;
  };`);

c = c.replace(/const handleUpdateAtr = async \(\) => \{[\s\S]*?await updatePosition\(position\.id, updatedData\);\n    \}\n  \};/, `const handleUpdateAtr = async () => {
    const newAtr = parseFloat(atrInput);
    if (!isNaN(newAtr) && newAtr > 0 && position) {
      const updatedData: any = {};
      
      const highest = position.trailingStop?.highestReached || metrics.avgEntry;
      let newStop = highest - (2 * newAtr);
      newStop = Math.max(newStop, metrics.currentStop);

      if (position.trailingStop) {
        updatedData.trailingStop = { ...position.trailingStop, atrAtEntry: newAtr, current: newStop };
      } else {
        updatedData.trailingStop = { initial: metrics.currentStop, current: newStop, highestReached: highest, atrAtEntry: newAtr };
      }
      
      if (position.plan) {
        updatedData.plan = { ...position.plan, atr: newAtr };
      }
      
      await updatePosition(position.id, updatedData);
    }
  };`);

const oldChartRegex = /\{\/\* Plan vs Reality Visual Chart \*\/\}\s*<div className="bg-slate-50 dark:bg-slate-800\/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700\/60 mb-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newChart = `
{/* Plan vs Reality Visual Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-10 rounded-3xl border border-slate-200 dark:border-slate-700/60 mb-6 relative mt-4 shadow-inner">
              <div className={\`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 border shadow-sm \${
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
                  <div className="text-center w-full text-xs text-slate-500 font-bold mt-8">الهدف أو الوقف غير محدد في الخطة</div>
                )}
              </div>
            </div>`;

c = c.replace(oldChartRegex, newChart);


const oldRightPaneRegex = /\{\/\* Right Column: Live TradingView Chart \*\/\}\s*<div className=\{`bg-white dark:bg-slate-900 rounded-3xl[\s\S]*?<\/div>/;
const newRightPane = ` {/* Right Column: Live TradingView Chart OR Ledger */}
        <div className={\`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 \${isChartExpanded ? 'h-[80vh]' : 'min-h-[520px]'}\`}>
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button 
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
              title={isChartExpanded ? "تصغير" : "تكبير"}
            >
              {isChartExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setTxModalType(txModalType === 'ledger' ? null : 'ledger' as any)}
              className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-2 font-black text-xs"
            >
              {txModalType === 'ledger' ? 'الشارت الفني' : 'سجل صفقات السهم'}
            </button>
          </div>

          {txModalType === 'ledger' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 mt-14">
               <div className="flex flex-wrap gap-2 mb-6">
                 <button onClick={() => setTxModalType('buy')} className="flex-1 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl font-black text-xs border border-blue-200 dark:border-blue-800">+ تمركز إضافي</button>
                 <button onClick={() => setTxModalType('sell')} className="flex-1 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl font-black text-xs border border-emerald-200 dark:border-emerald-800">↙ بيع جزئي</button>
                 <button className="flex-1 py-2 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl font-black text-xs border border-amber-200 dark:border-amber-800 opacity-50 cursor-not-allowed">توزيع نقدي</button>
                 <button className="flex-1 py-2 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-xl font-black text-xs border border-purple-200 dark:border-purple-800 opacity-50 cursor-not-allowed">تجزئة/مجاني</button>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">العملية</th>
                       <th className="py-3 px-2">التاريخ</th>
                       <th className="py-3 px-2">الكمية</th>
                       <th className="py-3 px-2">السعر</th>
                       <th className="py-3 px-2">الإجمالي</th>
                       <th className="py-3 px-2">الربح المحقق</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراءات</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {[...position.transactions].sort((a,b)=>b.date - a.date).map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num">
                         <td className="py-4 px-2">
                           <span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black \${tx.type === 'buy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}\`}>
                             {tx.type === 'buy' ? 'شراء' : 'بيع (جني ربح)'}
                           </span>
                         </td>
                         <td className="py-4 px-2 font-bold text-slate-600 dark:text-slate-300 text-xs">
                           {new Date(tx.date).toLocaleDateString('en-GB')}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.shares.toLocaleString()}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.price.toFixed(2)}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.amount.toFixed(2)}
                         </td>
                         <td className="py-4 px-2">
                           {tx.type === 'sell' && tx.id ? (
                             <span className={\`font-black \${(metrics.txPnL?.[tx.id] || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                               {(metrics.txPnL?.[tx.id] || 0) >= 0 ? '+' : ''}{(metrics.txPnL?.[tx.id] || 0).toFixed(2)}
                             </span>
                           ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                         </td>
                         <td className="py-4 px-2 flex justify-center">
                            <button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete coming soon">
                              <span className="text-xs">🗑️</span>
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            <AdvancedRealTimeChart 
              symbol={\`EGX:\${position.symbol}\`}
              interval="D"
              theme={theme === 'dark' ? 'dark' : 'light'}
              locale="ar_AE"
              autosize
              allow_symbol_change={false}
              hide_side_toolbar={false}
              details={true}
              save_image={true}
              timezone="Africa/Cairo"
            />
          )}
        </div>`;

c = c.replace(oldRightPaneRegex, newRightPane);

// Import Target if not imported
if (!c.includes('Target')) {
  c = c.replace(/LineChart,/, "LineChart,\n  Target,");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed everything!');
