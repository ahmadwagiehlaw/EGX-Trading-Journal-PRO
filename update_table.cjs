const fs = require('fs');
const file = 'src/components/TradesJournal.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace thead
const theadOld = `<thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">السهم والشركة</th>
                  <th className="py-3.5 px-3">القطاع والحالة</th>
                  <th className="py-3.5 px-3 text-left">متوسط الدخول</th>
                  <th className="py-3.5 px-3 text-left">الوقف المتحرك</th>
                  <th className="py-3.5 px-3 text-left">الهدف</th>
                  <th className="py-3.5 px-3 text-left">الأسهم المفتوحة</th>
                  <th className="py-3.5 px-3 text-left">رأس المال والمخاطرة</th>
                  <th className="py-3.5 px-3 text-left">صافي الربح / الخسارة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>`;
const theadNew = `<thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">السهم / التاريخ</th>
                  <th className="py-3.5 px-3">النوع</th>
                  <th className="py-3.5 px-3 text-left">السعر والتكلفة</th>
                  <th className="py-3.5 px-3 text-left">الكمية</th>
                  <th className="py-3.5 px-3 text-center">الانضباط (3MS)</th>
                  <th className="py-3.5 px-3 text-center">السبب / المشاعر</th>
                  <th className="py-3.5 px-3 text-left">الربح المحقق (للبيع)</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>`;

code = code.replace(theadOld, theadNew);

// Replace tbody
const sIdx = code.indexOf('<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">');
const eIdxStr = '              </tbody>';
const eIdx = code.indexOf(eIdxStr, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
const replacement = `<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {allTransactions.map((tx) => {
                  const stockInfo = getStockBySymbol(tx.symbol);
                  const sectorInfo = getSectorInfo(tx.sector || stockInfo?.sector);
                  const SectorIcon = sectorInfo.Icon;
                  const isBuy = tx.type === 'buy';
                  const txPnl = !isBuy && tx.avgEntry ? (tx.price - tx.avgEntry) * tx.shares : 0;
                  const isRuleBreaker = tx.isRuleBreaker;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Symbol & Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={\`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-xs shrink-0 \${
                            isBuy 
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20' 
                              : txPnl > 0 
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/20' 
                                : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-red-500/20'
                          }\`}>
                            <SectorIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white text-sm" dir="ltr">
                                {tx.symbol}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate max-w-[120px]">
                              {new Date(tx.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">
                        <span className={\`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 w-max \${
                          isBuy
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                        }\`}>
                          {isBuy ? '● شراء' : '○ بيع'}
                        </span>
                      </td>

                      {/* Price & Cost */}
                      <td className="py-3 px-3 text-left font-mono-num" dir="ltr">
                        <span className="font-black text-slate-900 dark:text-white text-sm block">
                          {tx.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          إجمالي: {formatEGP(tx.amount)}
                        </span>
                      </td>

                      {/* Shares */}
                      <td className="py-3 px-3 text-left font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                        <span className="font-black text-slate-900 dark:text-white">{tx.shares}</span>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-3 text-center">
                        {isBuy ? (
                          <div className="flex flex-col items-center gap-1">
                            {tx.checklist?.majorSR && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-200">دعم</span>}
                            {tx.checklist?.bos && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-200">BOS</span>}
                            {tx.checklist?.retest && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-200">إعادة اختبار</span>}
                            {!tx.checklist?.majorSR && !tx.checklist?.bos && !tx.checklist?.retest && <span className="text-slate-400 text-xs">—</span>}
                          </div>
                        ) : (
                          isRuleBreaker ? (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">مخالفة للقواعد ⚠️</span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">منضبط ✓</span>
                          )
                        )}
                      </td>

                      {/* Psychology & Reason */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {tx.entryReason && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 rounded">{tx.entryReason === 'support' ? 'دعم' : tx.entryReason === 'breakout' ? 'اختراق' : tx.entryReason === 'pullback' ? 'إعادة اختبار' : tx.entryReason === 'indicator' ? 'مؤشرات' : tx.entryReason}</span>}
                          {tx.exitReason && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 rounded">{tx.exitReason === 'target' ? 'هدف' : tx.exitReason === 'stop' ? 'وقف' : tx.exitReason === 'trailing' ? 'وقف متحرك' : tx.exitReason === 'time' ? 'وقف زمني' : tx.exitReason === 'panic' ? 'خوف' : tx.exitReason}</span>}
                          {tx.emotion && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{tx.emotion === 'confident' ? 'واثق' : tx.emotion === 'neutral' ? 'محايد' : tx.emotion === 'fomo' ? 'فومو' : tx.emotion === 'fear' ? 'خوف' : tx.emotion === 'greed' ? 'طمع' : tx.emotion === 'revenge' ? 'انتقام' : tx.emotion}</span>}
                          {!tx.entryReason && !tx.exitReason && !tx.emotion && <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      </td>

                      {/* Realized P&L */}
                      <td className="py-3 px-3 text-left font-mono-num font-black" dir="ltr">
                        {!isBuy ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={\`text-sm \${txPnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : txPnl < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}\`}>
                              {txPnl > 0 ? '+' : ''}{formatEGP(txPnl)}
                            </span>
                            {tx.target && tx.price >= tx.target && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 rounded">الهدف ✓</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {deleteConfirmId === tx.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                              <button
                                onClick={() => { deleteTransaction(tx.positionId, tx.id); setDeleteConfirmId(null); }}
                                className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded"
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-slate-400 hover:text-slate-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف هذه الحركة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>`;

code = code.substring(0, sIdx) + replacement + code.substring(eIdx + eIdxStr.length);
fs.writeFileSync(file, code);
}
