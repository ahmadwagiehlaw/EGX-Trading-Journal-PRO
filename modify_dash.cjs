const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tableBlock = `
      {/* Live Trading Radar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              مكتب التداول الحي (رادار الصفقات)
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
              متابعة حية للمراكز المفتوحة ({filteredPositions.filter(p => p.status === 'active').length} صفقات نشطة)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">السهم</th>
                <th className="py-4 px-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">المحفظة</th>
                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">الكمية</th>
                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">متوسط الدخول</th>
                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">السعر</th>
                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">أرباح عائمة</th>
                <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">الهدف / الوقف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredPositions.filter(p => p.status === 'active').map(pos => {
                const metrics = computePositionMetrics(pos);
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-900 dark:text-white text-lg" dir="ltr">{pos.symbol}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={\`px-2.5 py-1 rounded-lg text-[10px] font-black \${pos.portfolioType === 'speculation' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'}\`}>
                        {pos.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono-num font-bold text-slate-700 dark:text-slate-300">
                      {metrics.openShares.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center font-mono-num font-bold text-slate-700 dark:text-slate-300">
                      {metrics.avgEntry.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono-num font-bold text-slate-900 dark:text-white">
                      {metrics.currentPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={\`font-mono-num font-black \${metrics.netUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                        {metrics.netUnrealizedPnL > 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)} EGP
                      </span>
                    </td>
                    <td className="py-4 px-4 text-left font-mono-num font-bold">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-emerald-600 text-xs">🎯 {pos.plan?.target ? pos.plan.target.toFixed(2) : '-'}</span>
                        <span className="text-rose-600 text-xs">🛡️ {metrics.currentStop > 0 ? metrics.currentStop.toFixed(2) : (pos.plan?.stop ? pos.plan.stop.toFixed(2) : '-')}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPositions.filter(p => p.status === 'active').length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold text-sm">
                    لا توجد مراكز نشطة حالياً في هذه المحفظة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
`;

c = c.replace(/\{\/\* Active Plans Feed \*\/\}/, tableBlock + '\n\n      {/* Active Plans Feed */}');

fs.writeFileSync('src/components/Dashboard.tsx', c, 'utf8');
console.log('Modified Dashboard.tsx');
