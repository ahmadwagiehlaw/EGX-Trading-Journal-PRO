const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Imports
code = code.replace("import { useState, useMemo } from 'react';", "import ConfirmModal from './ConfirmModal';\nimport { useState, useMemo, useEffect } from 'react';");
code = code.replace("Target\n} from 'lucide-react';", "Target,\n  Trash2,\n  X,\n  Pencil,\n  Sparkles\n} from 'lucide-react';");
code = code.replace("computePositionMetrics } from '../utils/calculations';", "computePositionMetrics, computeOpenLotsLowestPriceFirst } from '../utils/calculations';");

code = code.replace('const { positions, updateTrailingStop, updatePosition } = useTrades();', 'const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats } = useTrades();');

// 2. Logic Injection
const logicStart = code.indexOf('if (!position || !metrics) return null;');
const logicHook = `
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  
  useEffect(() => {
    if (!isEditingCoreShares && position) {
      setCoreSharesInput(position.coreShares?.toString() || '');
    }
  }, [position?.coreShares, isEditingCoreShares, position]);

  const handleSaveCoreShares = async () => {
    if (!position || !metrics) return;
    const val = parseInt(coreSharesInput);
    if (isNaN(val) || val < 0 || val > metrics.openShares) {
      alert('يجب أن تكون كمية الكور رقم صحيح بين 0 والكمية المفتوحة بالكامل (' + metrics.openShares + ')');
      return;
    }
    await updatePosition(position.id, { coreShares: val });
    setIsEditingCoreShares(false);
  };

  const generateInsights = () => {
    if (!position || !metrics) return [];
    const insights = [];
    const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;
    
    if (pnlPercent > 15) {
      insights.push({ type: 'success', text: \`أنت محقق ربح ممتاز بحوالي \${pnlPercent.toFixed(1)}% في هذا التمركز. يوصى بجني جزء من الأرباح (بيع جزئي) لتأمين المكسب.\`, action: 'بيع جزئي' });
    } else if (pnlPercent < -8) {
      insights.push({ type: 'warning', text: \`التمركز خاسر بنسبة \${Math.abs(pnlPercent).toFixed(1)}%. راقب وقف الخسارة بصرامة ولا تترك الخسارة تتفاقم.\` });
    }

    const riskPercent = metrics.avgEntry > 0 ? ((metrics.avgEntry - metrics.currentStop) / metrics.avgEntry) * 100 : 0;
    if (pnlPercent > 5 && riskPercent > 0) {
      insights.push({ type: 'info', text: 'السعر ارتفع بشكل جيد لكن وقف الخسارة لا يزال تحت سعر الدخول. يوصى برفع وقف الخسارة (Trailing Stop) لنقطة الدخول أو أعلى لحماية رأس المال.' });
    }

    if (position.portfolioType === 'investment') {
      const coreAmount = position.coreShares ? position.coreShares * (position.currentMarketPrice || 0) : 0;
      const totalCap = coreStats?.totalInvestmentCapital || 1;
      const coreWeight = (coreAmount / totalCap) * 100;
      
      if (coreAmount === 0 && position.plan?.strategy === 'core') {
         insights.push({ type: 'info', text: 'هذا السهم مصنف كـ (Core) لكنك لم تحدد كمية الكور المحتفظ بها. قم بتحديد أسهم الكور لحمايتها من البيع العاطفي.' });
      } else if (coreWeight > 30) {
         insights.push({ type: 'warning', text: \`وزن هذا السهم الأساسي يشكل \${coreWeight.toFixed(1)}% من إجمالي محفظة الاستثمار. هذا تركز عالي وقد يزيد المخاطرة، فكر في إعادة التوازن.\` });
      }
    }

    if (position.portfolioType === 'speculation' && position.journal?.openedDate) {
      const daysHeld = (Date.now() - position.journal.openedDate) / (1000 * 60 * 60 * 24);
      if (daysHeld > 14 && pnlPercent < 2) {
        insights.push({ type: 'warning', text: \`هذا التمركز المضاربي مستمر منذ \${Math.floor(daysHeld)} يوم بدون ربح يذكر. انتبه لتكلفة الفرصة البديلة (Cash Drag).\` });
      }
    }

    if (insights.length === 0) {
      insights.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    return insights;
  };
  const insights = generateInsights();

`;
code = code.slice(0, logicStart) + logicHook + code.slice(logicStart);


// 3. UI Injections

// A. Core Shares Bar (Left Column)
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
            </div>
`;
const quickTxMarker = '{/* Quick Partial Transactions Row */}';
code = code.replace(quickTxMarker, coreUI + '\n          ' + quickTxMarker);


// B. AI Panel & Open Lots Table (Right Column Ledger View)
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

const tableMarker = '<div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">';
code = code.replace(tableMarker, aiAndLotsUI + '\n               ' + tableMarker);

// C. Delete Transaction ConfirmModal
const deleteBtnOld = `<button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete coming soon">
                              <Trash2 className="w-4 h-4"/>
                            </button>`;
const deleteBtnNew = `<button 
                              onClick={() => setConfirmTxId(tx.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف المعاملة"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>`;
code = code.replace(deleteBtnOld, deleteBtnNew);

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
const endMarker = '    </div>\n  );\n}';
code = code.replace(endMarker, confirmModalUI + '\n' + endMarker);


fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Master build applied to ActiveTrades.tsx");
