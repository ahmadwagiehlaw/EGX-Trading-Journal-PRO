const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('filteredPlans.map(item => {');
const endIdx = code.indexOf('</div>', code.indexOf('تحويل لصفقة فعلية (تمركز)', tIdx)) + 6;
const cardBlock = code.slice(tIdx, endIdx);

const newCardBlock = `filteredPlans.map(item => {
          const rrr = calculateRRR(item);
          const isReady = item.status === 'ready';
          const { min: entryMin, max: entryMax } = getEntryRange(item);
          
          return (
            <div 
              key={item.id} 
              onClick={() => { setSelectedPlan(item); setIsModalOpen(true); }}
              className={\`cursor-pointer bg-white dark:bg-slate-900 backdrop-blur-md border rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col relative group \${
                isReady 
                  ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-950 shadow-blue-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }\`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{item.symbol || '---'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md w-fit line-clamp-1">
                    {item.strategy || 'بدون استراتيجية'}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={\`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border \${
                    isReady 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }\`}>
                    {isReady ? <Target className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isReady ? 'جاهز للتنفيذ' : 'قيد المتابعة'}
                  </span>
                  <span className="text-[10px] font-mono-num font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                    RRR {rrr}
                  </span>
                </div>
              </div>

              {/* Entry Zone Display (Range Bar) */}
              <div className="my-3 p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-blue-500" />
                    نطاق الدخول:
                  </span>
                  <span className="font-black text-blue-700 dark:text-blue-400 font-mono-num" dir="ltr">
                    {entryMin === entryMax || entryMax === 0 
                      ? \`\${entryMin.toFixed(2)} EGP\`
                      : \`\${entryMin.toFixed(2)} — \${entryMax.toFixed(2)} EGP\`
                    }
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-center text-xs">
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 block">الهدف الرئيسي</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm" dir="ltr">{item.target?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-red-50/70 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-100 dark:border-red-900/60">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-500 block">وقف الخسارة</span>
                    <span className="font-black text-red-700 dark:text-red-300 text-sm" dir="ltr">{item.stop?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Updates Badge if any */}
              {item.updates && item.updates.length > 0 && (
                <div className="mb-3 text-[11px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {item.updates.length} تحديث مسجل
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-2 pt-1">
                {isReady && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleConvertToTrade(item); }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    تحويل لصفقة فعلية (تمركز)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="w-full py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  <FileText className="w-3 h-3" />
                  انقر لعرض وتعديل التفاصيل
                </div>
              </div>`;

code = code.replace(cardBlock, newCardBlock);
fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
console.log("Card UI modified");
