const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// The replacement code for the Header and the new Live Pulse
const newHeaderAndPulse = \
            {/* Header / Ticker Summary */}
            <div className="flex justify-between items-start mb-6 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position.symbol}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={\px-2 py-0.5 rounded-md text-[10px] font-black border \\}>
                      {metrics.isOpen ? 'مركز مفتوح' : 'مغلق'}
                    </span>
                    {dominantPortfolio === 'speculation' ? (
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        مضاربة
                      </span>
                    ) : (
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        استثمار
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left flex flex-col items-end">
                  {isHighRisk && (
                    <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold mb-1" title="القيمة السوقية تتجاوز 25% من المحفظة">
                      ⚠️ تجاوز 25%
                    </span>
                  )}
              </div>
            </div>

            {/* LIVE MARKET PULSE */}
            {metrics.isOpen && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500">سعر السوق الحالي</span>
                    <span className="text-[10px] font-bold text-slate-400">EGP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="any"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg py-1 px-2 text-lg font-black font-mono-num text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      defaultValue={position.currentMarketPrice || metrics.avgEntry}
                      onBlur={(e) => updateMarketPrice(position.id, parseFloat(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className={\p-3 rounded-2xl border shadow-sm flex flex-col justify-between \\}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={\	ext-[10px] font-black \\}>
                      أرباح/خسائر عائمة
                    </span>
                  </div>
                  <div className={\	ext-xl font-black font-mono-num text-left \\} dir="ltr">
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
\;

// Replace from {/* Header / Ticker Summary */} to just before {/* Plan vs Reality Visual Chart & Metrics */}
const startMarker = '{/* Header / Ticker Summary */}';
const endMarker = '{/* Plan vs Reality Visual Chart & Metrics */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newHeaderAndPulse + '\\n            ' + code.substring(endIndex);
  
  // Oh, wait, we also need to ensure updateMarketPrice is exported from useTrades and imported
  if (!code.includes('updateMarketPrice')) {
    code = code.replace('const { positions, updateTrailingStop', 'const { positions, updateTrailingStop, updateMarketPrice');
  }
  
  fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
  console.log('Pulse added successfully');
} else {
  console.log('Markers not found');
}
