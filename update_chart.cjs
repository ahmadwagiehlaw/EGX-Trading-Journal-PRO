const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const anchor = `                      {/* Target */}
                      <div className="absolute flex flex-col items-center" style={{ right: \`\${targetPercent}%\`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Target className="w-3 h-3"/> الهدف</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{rawMax.toFixed(2)}</span>
                      </div>`;

const replaceStr = `                      {/* Target T1 */}
                      <div className="absolute flex flex-col items-center" style={{ right: \`\${targetPercent}%\`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Target className="w-3 h-3"/> T1</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{rawMax.toFixed(2)}</span>
                      </div>

                      {/* Optional Targets T2, T3 */}
                      {position!.plan.targets?.map((t, idx) => {
                        const tPercent = getPercent(t);
                        return (
                          <div key={idx} className="absolute flex flex-col items-center" style={{ right: \`\${tPercent}%\`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                            <span className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1"><Target className="w-2.5 h-2.5"/> T{idx + 2}</span>
                            <span className="text-xs font-mono-num font-bold text-slate-500 dark:text-slate-400">{t.toFixed(2)}</span>
                          </div>
                        );
                      })}`;

at = at.replace(anchor, replaceStr);

// We need to also adjust the chartMin and chartMax so that they include targets T2, T3
const boundsOld = `                  // Dynamic range to prevent stacking/clamping when prices go out of bounds
                  const chartMin = Math.min(rawMin, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMax);
                  const chartMax = Math.max(rawMax, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMin);`;

const boundsNew = `                  // Dynamic range to prevent stacking/clamping when prices go out of bounds
                  const maxTarget = position!.plan.targets?.length ? Math.max(...position!.plan.targets) : rawMax;
                  const chartMin = Math.min(rawMin, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMax, maxTarget);
                  const chartMax = Math.max(rawMax, metrics!.avgEntry, metrics!.currentPrice, currentStop, rawMin, maxTarget);`;

at = at.replace(boundsOld, boundsNew);

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('✓ Updated Plan vs Reality chart with T2/T3');
