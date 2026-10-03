const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// A. AI Panel & Open Lots Table (Right Column Ledger View)
const aiAndLotsUI = `
             {/* Smart Insights Panel (AI Advisor) */}
             {insights.length > 0 && (
               <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-8 shadow-sm">
                 <div className="flex items-center gap-2 mb-3">
                   <Sparkles className="w-5 h-5 text-indigo-500" />
                   <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI) والتوصيات</h3>
                 </div>
                 <div className="grid gap-2">
                   {insights.map((insight, idx) => (
                     <div key={idx} className={\`flex items-start gap-3 p-3 rounded-xl \${
                       insight.type === 'warning' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                       insight.type === 'success' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                       'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                     }\`}>
                       <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                       {insight.action && (
                         <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 transition-transform flex-shrink-0">
                           {insight.action}
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Open Lots (Lowest Price First / FIFO) Table */}
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Target className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">الدفعات المفتوحة (Open Lots)</h3>
                 </div>
                 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800/50">
                   قاعدة: الأقل سعراً أولاً (Lowest-Price First)
                 </span>
               </div>
               
               <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">تاريخ الشراء</th>
                       <th className="py-3 px-2">سعر الشراء</th>
                       <th className="py-3 px-2">الكمية المتبقية</th>
                       <th className="py-3 px-2">الربح/الخسارة</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراء</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {computeOpenLotsLowestPriceFirst(position!.transactions).map(lot => {
                       const lotValue = lot.remainingShares * metrics!.currentPrice;
                       const lotCost = lot.remainingShares * lot.price;
                       const lotPnL = lotValue - lotCost;
                       const lotPnLPercent = lotCost > 0 ? (lotPnL / lotCost) * 100 : 0;
                       const isWinning = lotPnL > 0;
                       
                       return (
                         <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                           <td className="py-3 px-2">{new Date(lot.date).toLocaleDateString('en-GB')}</td>
                           <td className="py-3 px-2 text-blue-600 dark:text-blue-400">{lot.price.toFixed(2)}</td>
                           <td className="py-3 px-2">{lot.remainingShares.toLocaleString()} سهم</td>
                           <td className={\`py-3 px-2 \${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                             {lotPnL > 0 ? '+' : ''}{lotPnL.toFixed(2)} ({lotPnLPercent.toFixed(1)}%)
                           </td>
                           <td className="py-3 px-2">
                             <button 
                               onClick={() => setTxModalType('sell')}
                               className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                             >
                               جني ربح
                             </button>
                           </td>
                         </tr>
                       );
                     })}
                     {computeOpenLotsLowestPriceFirst(position!.transactions).length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-8 text-slate-400 text-xs font-bold">لا توجد دفعات مفتوحة حالياً.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
             
             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-400" />
                سجل الحركات الكامل
             </h3>
`;
const tableMarker = '<div className="overflow-x-auto">';
code = code.replace(tableMarker, aiAndLotsUI + '\n               ' + tableMarker);


// C. ConfirmModal injection
const confirmModalUI = `
      <ConfirmModal
        isOpen={!!confirmTxId}
        title="حذف المعاملة"
        message="هل أنت متأكد من حذف هذه المعاملة بشكل نهائي؟ سيتم إعادة حساب متوسطات السهم."
        type="danger"
        confirmText="حذف"
        onConfirm={() => {
          if (confirmTxId) {
            deleteTransaction(position!.id, confirmTxId);
            setConfirmTxId(null);
          }
        }}
        onCancel={() => setConfirmTxId(null)}
      />
`;
// find the very last closing div
const endIdx = code.lastIndexOf('</div>');
code = code.slice(0, endIdx) + confirmModalUI + '\n    </div>\n  );\n}';

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Injected table and confirm modal");
