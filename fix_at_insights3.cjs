const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Fix currentMarketPrice undefined error
code = code.replace("position.currentMarketPrice : 0", "(position.currentMarketPrice || 0) : 0");

// Remove the wrongly injected UI block
const wrongStart = code.indexOf('        {/* Smart Insights AI */}');
const wrongEnd = code.indexOf('        {/* Main Content Grid */}', wrongStart);
if (wrongStart > -1 && wrongEnd > -1) {
    code = code.slice(0, wrongStart) + code.slice(wrongEnd);
}

// Inject it inside the component, correctly!
const gridStart = code.indexOf('<div className={isChartExpanded ? "flex flex-col" : "grid lg:grid-cols-2 gap-6 items-stretch"}>');
if (gridStart > -1) {
    const insightsUI = `
        {/* Smart Insights AI */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-5 border border-blue-100 dark:border-blue-800 shadow-sm relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white">المستشار الذكي (AI Advisor)</h3>
                <p className="text-xs text-slate-500 font-bold">توصيات مخصصة لمركزك الحالي وإدارة المخاطر</p>
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-white/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                  <div className={\`shrink-0 mt-1 w-2.5 h-2.5 rounded-full shadow-sm \${insight.type === 'warning' ? 'bg-amber-500' : insight.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}\`}></div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
`;
    code = code.slice(0, gridStart) + insightsUI + "\n        " + code.slice(gridStart);
}

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Fixed ActiveTrades Insights Placement and typing');
