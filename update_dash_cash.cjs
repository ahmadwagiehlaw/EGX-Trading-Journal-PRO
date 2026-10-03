const fs = require('fs');
let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const anchor = `            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-600">السيولة المتاحة للتداول (كاش)</span>
                  <span className="text-slate-600 dark:text-slate-400" dir="ltr">{formatEGP(Math.max(0, availableLiquidity))}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: \`\${Math.min(100, (Math.max(0, availableLiquidity) / (activeCapital || 1)) * 100)}%\` }}></div>
                </div>
              </div>`;

const cashPercent = `((Math.max(0, availableLiquidity) / (activeCapital || 1)) * 100)`;
const equityPercent = `((activeOpenCapital / (activeCapital || 1)) * 100)`;

const replace = `            <div className="space-y-5">
              {/* Cash vs Equity Exposure Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">مقياس السيولة مقابل الأسهم (Exposure)</span>
                </div>
                
                {/* Visual Segmented Bar */}
                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                  <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: \`\${Math.min(100, ${equityPercent})}%\` }} title="الأسهم المقيدة"></div>
                  <div className="bg-emerald-400 h-full transition-all duration-700" style={{ width: \`\${Math.min(100, ${cashPercent})}%\` }} title="الكاش المتاح"></div>
                </div>
                
                {/* Legend & Stats */}
                <div className="flex justify-between items-start mt-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                      في السوق (Equity)
                    </div>
                    <div className="font-mono-num font-black text-slate-800 dark:text-slate-200 mt-0.5" dir="ltr">{${equityPercent}.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400 font-bold" dir="ltr">{formatEGP(activeOpenCapital)}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      سيولة (Cash)
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                    </div>
                    <div className="font-mono-num font-black text-slate-800 dark:text-slate-200 mt-0.5" dir="ltr">{${cashPercent}.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400 font-bold" dir="ltr">{formatEGP(Math.max(0, availableLiquidity))}</div>
                  </div>
                </div>
                
                {/* Warning for Cash Drag or Over-exposure */}
                {${cashPercent} > 80 && (
                  <p className="mt-3 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    ⚠️ <strong>تحذير (Cash Drag):</strong> سيولتك مرتفعة جداً. إذا كان السوق في ترند صاعد، فأنت تفوت أرباحاً وتخسر مقابل التضخم.
                  </p>
                )}
                {${cashPercent} < 5 && (
                  <p className="mt-3 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                    🚨 <strong>تحذير مخاطرة:</strong> محفظتك مستثمرة بالكامل (Fully Exposed). لا توجد سيولة كافية لاقتناص الفرص أو التعديل في حالات الهبوط المفاجئ.
                  </p>
                )}
              </div>`;

dash = dash.replace(anchor, replace);
fs.writeFileSync('src/components/Dashboard.tsx', dash, 'utf8');
console.log('✓ Updated Dashboard Cash vs Equity Exposure');
