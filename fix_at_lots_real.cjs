const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('<table className="w-full text-sm text-center">');
if (tIdx > -1) {
    const parentDivStart = code.lastIndexOf('<div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">', tIdx);
    
    // We will inject the openLotsUI right before this parentDivStart
    const openLotsUI = `
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
               
               <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
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
             
             {/* All Transactions History Table (below) */}
`;

    if (parentDivStart > -1) {
        code = code.slice(0, parentDivStart) + openLotsUI + code.slice(parentDivStart);
        fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
        console.log("Injected Open Lots successfully");
    } else {
        console.log("Could not find parentDivStart for table!");
    }
} else {
    console.log("Could not find table!");
}
