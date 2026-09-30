const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// The Blue Box
const blueBoxStart = content.indexOf('{/* Trailing Stop Adjustment Input */}');
const blueBoxEnd = content.indexOf('</div>\n\n          {/* Quick Partial Transactions Row */}');
if (blueBoxStart !== -1 && blueBoxEnd !== -1) {
    content = content.slice(0, blueBoxStart) + content.slice(blueBoxEnd);
}

// The Right Pane
const rightPaneStart = content.indexOf('{/* Right Column: Live TradingView Chart */}');
const rightPaneEnd = content.indexOf('{/* Left Column: Trailing Stop Engine & Ledger Control */}');
const newRightPane = `{/* Right Column: Live TradingView Chart OR Ledger */}
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
                              <Trash2 className="w-4 h-4"/>
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
        </div>

        `;
content = content.slice(0, rightPaneStart) + newRightPane + content.slice(rightPaneEnd);

// Fix modal defaultType issue
content = content.replace(/defaultType=\{txModalType === 'sellAll' \? 'sell' : txModalType \|\| 'buy'\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}");
content = content.replace(/defaultType=\{txModalType === 'sellAll' \|\| txModalType === 'edit' \? 'sell' : \(txModalType as 'buy' \| 'sell' \| undefined\) \|\| 'buy'\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType === 'ledger' ? 'buy' : (txModalType as 'buy' | 'sell' | undefined)) || 'buy'}");

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Phase 3 done');
