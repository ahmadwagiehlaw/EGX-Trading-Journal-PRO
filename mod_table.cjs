const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/<th className="px-4 py-3 whitespace-nowrap text-center">الإجمالي<\/th>/, `<th className="px-4 py-3 whitespace-nowrap text-center">الإجمالي</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">الربح المحقق</th>`);

c = c.replace(/<td className="px-4 py-3 whitespace-nowrap font-black font-mono-num text-center text-slate-900 dark:text-white" dir="ltr">\s*\{tx\.type === 'split' \|\| tx\.type === 'bonus' \? '—' : tx\.amount\.toLocaleString\(undefined, \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)\}\s*<\/td>/, `<td className="px-4 py-3 whitespace-nowrap font-black font-mono-num text-center text-slate-900 dark:text-white" dir="ltr">
                                {tx.type === 'split' || tx.type === 'bonus' ? '—' : tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center font-black font-mono-num" dir="ltr">
                                {(tx.type === 'sell' || tx.type === 'dividend') && metrics.txPnL && metrics.txPnL[tx.id] !== undefined ? (
                                  <span className={metrics.txPnL[tx.id] >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                    {metrics.txPnL[tx.id] > 0 ? '+' : ''}{metrics.txPnL[tx.id].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>`);

// Delete button logic is tricky with regex because it might have multi-line structure.
c = c.replace(/<div className="flex items-center justify-end gap-2">\s*<button[\s\S]*?<\/button>\s*<\/div>/, `<div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setTxModalType('edit'); setTransactionToEdit(tx); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors" title="تعديل">
                                    <PenSquare className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => {
                                    if(window.confirm('هل أنت متأكد من حذف هذه العملية؟')) {
                                      deleteTransaction(position.id, tx.id);
                                    }
                                  }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors" title="حذف">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>`);

// Add deleteTransaction to the hook destructuring!
c = c.replace(/const \{ positions, updateTrailingStop, updatePosition, capitalInvestment, capitalSpeculation \} = useTrades\(\);/, "const { positions, updateTrailingStop, updatePosition, deleteTransaction, capitalInvestment, capitalSpeculation } = useTrades();");

// Add Trash2 to imports
c = c.replace(/import \{\s*ArrowDownToLine,/, "import { ArrowDownToLine, Trash2,");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Modified ActiveTrades table');
