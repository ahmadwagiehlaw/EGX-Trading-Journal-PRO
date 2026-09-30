const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/<td className="px-4 py-3 whitespace-nowrap text-left">\s*<div className="flex items-center justify-end gap-1\.5">[\s\S]*?<\/td>/g, `<td className="px-4 py-3 whitespace-nowrap text-left">
                                <div className="flex items-center justify-end gap-1.5">
                                  {tx.type === 'buy' && (
                                    <button 
                                      onClick={() => {
                                        setLinkedBuyId(tx.id);
                                        setDefaultModalShares(remainingShares.toString());
                                        setTxModalType('sell');
                                      }}
                                      disabled={isFullyClosed}
                                      className={\`p-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 transition-colors border \${
                                        isFullyClosed 
                                          ? 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed' 
                                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
                                      }\`}
                                      title="إغلاق هذا الشراء"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      إغلاق
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => {
                                      setTransactionToEdit(tx);
                                      setTxModalType('edit');
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 transition-colors border border-slate-200 dark:border-slate-700"
                                    title="تعديل"
                                  >
                                    <PenSquare className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('هل أنت متأكد من حذف هذه العملية؟')) {
                                        deleteTransaction(position.id, tx.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 transition-colors border border-slate-200 dark:border-slate-700"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>`);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed actions column in ActiveTrades');
