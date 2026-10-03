const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tStopStr = `            {/* Trailing Stop Metrics Cards */}`;

const timeStopLogic = `
            {/* Time Stop Alert */}
            {position!.plan?.timeStopDays && position!.transactions.length > 0 && (() => {
              const firstTx = [...position!.transactions].sort((a, b) => a.date - b.date)[0];
              const daysHeld = Math.floor((Date.now() - firstTx.date) / (1000 * 60 * 60 * 24));
              const maxDays = position!.plan.timeStopDays;
              const percent = Math.min(100, (daysHeld / maxDays) * 100);
              const isDanger = daysHeld >= maxDays;
              
              return (
                <div className={\`mb-6 p-4 rounded-2xl border flex flex-col gap-2 shadow-sm \${isDanger ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50'}\`}>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={\`flex items-center gap-1.5 \${isDanger ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}\`}>
                      <Clock className="w-4 h-4" /> 
                      الوقف الزمني للصفقة
                    </span>
                    <span className={\`font-mono-num \${isDanger ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}\`}>
                      {daysHeld} / {maxDays} يوم
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={\`h-full rounded-full transition-all duration-1000 \${isDanger ? 'bg-rose-500' : 'bg-amber-400'}\`} style={{ width: \`\${percent}%\` }}></div>
                  </div>
                  
                  {isDanger && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                      ⚠️ لقد تجاوزت هذه الصفقة المدة القصوى المحددة في الخطة. إذا لم يتحرك السعر في اتجاهك، فكر في الخروج لتجنب تجميد السيولة (Cash Drag).
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Trailing Stop Metrics Cards */}`;

at = at.replace(tStopStr, timeStopLogic);
fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('✓ Added Time Stop logic to ActiveTrades');
