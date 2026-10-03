const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

if (!code.includes('updateMarketPrice')) {
    code = code.replace('const { positions, updateTrailingStop', 'const { positions, updateTrailingStop, updateMarketPrice');
}

// Remove old avg entry and open shares paragraph inside the header
code = code.replace(/<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">[\s\S]*?<\/p>/, '');
code = code.replace(/<p className="text-slate-400 font-bold text-xs mb-1">.*?<\/p>/, '');
code = code.replace(/<p className=\{`text-xl font-black font-mono-num \$\{isHighRisk \? 'text-rose-600 dark:text-rose-500' : 'text-slate-900 dark:text-white'\}`\}>[\s\S]*?<\/p>/, '');

const livePulse = `
            {/* Live Market Pulse */}
            {metrics.isOpen && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500">السعر (تحديث يدوي)</span>
                    <span className="text-[10px] font-bold text-slate-400">EGP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="any"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-2 text-lg font-black font-mono-num text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-blue-300"
                      defaultValue={position.currentMarketPrice || metrics.avgEntry}
                      onBlur={(e) => updateMarketPrice(position.id, parseFloat(e.target.value))}
                      dir="ltr"
                      title="اضغط لتحديث آخر سعر للسهم"
                    />
                  </div>
                  {position.currentMarketPrice && (
                    <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="محدث" />
                  )}
                </div>

                <div className={\`p-3 rounded-2xl border shadow-sm flex flex-col justify-between \${
                  metrics.netUnrealizedPnL > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' : 
                  metrics.netUnrealizedPnL < 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30' : 
                  'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }\`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={\`text-[10px] font-black \${metrics.netUnrealizedPnL > 0 ? 'text-emerald-600 dark:text-emerald-400' : metrics.netUnrealizedPnL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}\`}>
                      أرباح/خسائر عائمة
                    </span>
                  </div>
                  <div className={\`text-xl font-black font-mono-num text-left \${metrics.netUnrealizedPnL > 0 ? 'text-emerald-700 dark:text-emerald-300' : metrics.netUnrealizedPnL < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-white'}\`} dir="ltr">
                    {metrics.netUnrealizedPnL > 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-500 mb-1">الكمية المفتوحة</span>
                  <span className="block text-lg font-black font-mono-num text-slate-900 dark:text-white">{metrics.openShares.toLocaleString()} سهم</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-500 mb-1">متوسط الدخول</span>
                  <span className="block text-lg font-black font-mono-num text-slate-900 dark:text-white">{metrics.avgEntry.toFixed(2)} EGP</span>
                </div>

              </div>
            )}
`;

const insertMarker = '{/* Plan vs Reality Visual Chart & Metrics */}';
const insertIndex = code.indexOf(insertMarker);
code = code.substring(0, insertIndex) + livePulse + '\n            ' + code.substring(insertIndex);

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Done');
