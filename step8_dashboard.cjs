const fs = require('fs');
let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Insert the Core & Satellite gauge AFTER the filter tabs end, when investment is selected
// Anchor: right after the </div> that closes the filter section, before the readyPlans banner
const anchor = `{/* Market Heat / Ready Plans Banner */}`;

const coreGaugeWidget = `{/* Core & Satellite Health Gauge — only shows when viewing investment portfolio */}
      {portfolioFilter === 'investment' && coreStats.totalInvestmentCapital > 0 && (
        <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition-all ${
          coreStats.isBalanced 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40'
        }`}>
          {/* Icon + Status */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${coreStats.isBalanced ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
            <span className="text-xl">{coreStats.isBalanced ? '⚖️' : '⚠️'}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-black ${coreStats.isBalanced ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {coreStats.isBalanced ? 'محفظة الاستثمار متوازنة ✓' : `تنبيه: أسهم Satellite تجاوزت الحد المسموح (${coreSatelliteTarget}% Core)`}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full flex">
                <div
                  className="bg-indigo-500 transition-all duration-700"
                  style={{ width: \`\${Math.min(100, coreStats.corePercent)}%\` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-700"
                  style={{ width: \`\${Math.min(100, coreStats.satellitePercent)}%\` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                Core {coreStats.corePercent.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Satellite {coreStats.satellitePercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 mr-auto">هدفك: {coreSatelliteTarget}% Core</span>
            </div>
          </div>
        </div>
      )}

      `;

dash = dash.replace(anchor, coreGaugeWidget + anchor);

// Make sure coreStats and coreSatelliteTarget are in the useTrades destructure
if (!dash.includes('coreStats')) {
  dash = dash.replace(
    `  } = useTrades();`,
    `    coreStats,
    coreSatelliteTarget,
  } = useTrades();`
  );
}

fs.writeFileSync('src/components/Dashboard.tsx', dash, 'utf8');
console.log('✓ Dashboard Core & Satellite gauge added');
