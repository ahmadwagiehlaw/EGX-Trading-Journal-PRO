const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// Add state for filter
c = c.replace(
  `const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook'>('overview');`,
  `const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');
  const [posTableFilter, setPosTableFilter] = useState<'all' | 'investment' | 'speculation' | 'open' | 'closed'>('all');`
);

// Find and add the new Positions tab button after the TAB 4 button - find the end of the sub-tab navigation section
const playbookBtnEnd = `{/* TAB 4: STRATEGY PLAYBOOK */}`;
const positionsBtn = `{/* TAB 5: ALL POSITIONS TABLE */}
      {activeSubTab === 'positions' && (() => {
        const allPositionsFiltered = positions.filter(p => {
          if (posTableFilter === 'investment') return p.portfolioType === 'investment';
          if (posTableFilter === 'speculation') return p.portfolioType === 'speculation';
          if (posTableFilter === 'open') {
            const m = computePositionMetrics(p, commissionRate);
            return m.isOpen;
          }
          if (posTableFilter === 'closed') {
            const m = computePositionMetrics(p, commissionRate);
            return !m.isOpen;
          }
          return true;
        });
        
        const totalInvestedInTable = allPositionsFiltered.reduce((acc, p) => {
          const m = computePositionMetrics(p, commissionRate);
          return acc + m.openInvested;
        }, 0);
        const totalRealizedInTable = allPositionsFiltered.reduce((acc, p) => {
          const m = computePositionMetrics(p, commissionRate);
          return acc + m.netRealizedPnL;
        }, 0);

        return (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">جدول الصفقات الشامل</h3>
                <p className="text-xs text-slate-400 font-bold">{allPositionsFiltered.length} صفقة</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'investment', 'speculation', 'open', 'closed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPosTableFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      posTableFilter === f
                        ? f === 'investment' ? 'bg-emerald-600 text-white' 
                          : f === 'speculation' ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f === 'all' ? 'الكل' : f === 'investment' ? '📊 استثمار' : f === 'speculation' ? '⚡ مضاربة' : f === 'open' ? '🟢 مفتوحة' : '✅ مغلقة'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 mb-0.5">إجمالي السيولة المقيدة</p>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono-num" dir="ltr">{formatEGP(totalInvestedInTable)}</p>
              </div>
              <div className={`bg-white dark:bg-slate-900 rounded-xl p-3 border text-center ${totalRealizedInTable >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800'}`}>
                <p className="text-[10px] font-black text-slate-400 mb-0.5">✅ الأرباح المحققة (صافي)</p>
                <p className={`text-lg font-black font-mono-num ${totalRealizedInTable >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">{totalRealizedInTable > 0 ? '+' : ''}{formatEGP(totalRealizedInTable)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 mb-0.5">عدد الصفقات</p>
                <p className="text-lg font-black text-slate-800 dark:text-white font-mono-num">{allPositionsFiltered.length}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
              <table className="w-full text-right text-xs" dir="rtl">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[11px]">
                  <tr>
                    <th className="py-3 px-4">السهم</th>
                    <th className="py-3 px-3 text-center">المحفظة</th>
                    <th className="py-3 px-3 text-center">الحالة</th>
                    <th className="py-3 px-3 text-center">الأسهم المفتوحة</th>
                    <th className="py-3 px-3 text-center">متوسط الدخول</th>
                    <th className="py-3 px-3 text-center">السيولة المقيدة</th>
                    <th className="py-3 px-3 text-center">✅ ربح محقق</th>
                    <th className="py-3 px-3 text-center">📊 ربح ورقي</th>
                    <th className="py-3 px-3 text-center">وقف الخسارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {allPositionsFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-bold text-xs">لا توجد صفقات في هذا التصنيف</td>
                    </tr>
                  ) : allPositionsFiltered.map(pos => {
                    const m = computePositionMetrics(pos, commissionRate);
                    const unrealPnL = m.openShares > 0 && pos.currentMarketPrice ? (pos.currentMarketPrice - m.avgEntry) * m.openShares : null;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                              {pos.symbol.slice(0,2)}
                            </div>
                            <span className="font-black text-slate-900 dark:text-white" dir="ltr">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            pos.portfolioType === 'speculation'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {pos.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            m.isOpen
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {m.isOpen ? 'مفتوح' : 'مغلق'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num font-black text-slate-700 dark:text-slate-300">
                          {m.openShares.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num text-slate-600 dark:text-slate-400" dir="ltr">
                          {m.avgEntry.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num text-purple-700 dark:text-purple-400 font-black" dir="ltr">
                          {m.openInvested > 0 ? formatEGP(m.openInvested) : '-'}
                        </td>
                        <td className={`py-3 px-3 text-center font-mono-num font-black ${m.netRealizedPnL > 0 ? 'text-emerald-600 dark:text-emerald-400' : m.netRealizedPnL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} dir="ltr">
                          {m.netRealizedPnL !== 0 ? (m.netRealizedPnL > 0 ? '+' : '') + formatEGP(m.netRealizedPnL) : '-'}
                        </td>
                        <td className={`py-3 px-3 text-center font-mono-num font-black ${unrealPnL === null ? 'text-slate-400' : unrealPnL >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} dir="ltr">
                          {unrealPnL !== null ? (unrealPnL > 0 ? '+' : '') + formatEGP(unrealPnL) : '— أدخل السعر'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-num text-rose-600 dark:text-rose-400 font-black" dir="ltr">
                          {m.currentStop > 0 ? m.currentStop.toFixed(2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      ${playbookBtnEnd}`;

c = c.replace(playbookBtnEnd, positionsBtn);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Added positions tab');
