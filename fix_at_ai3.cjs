const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const targetStr = `              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics!.openShares.toLocaleString()} سهم</p>
              </div>
            </div>`;

const newStr = `              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics!.openShares.toLocaleString()} سهم</p>
              </div>
            </div>

          {/* Smart Insights Panel (AI Advisor) */}
          {insights.length > 0 && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI) والتوصيات</h3>
              </div>
              <div className="grid gap-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className={\`flex items-start gap-3 p-3 rounded-xl \${
                    insight.type === 'warning' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                    insight.type === 'success' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                    'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }\`}>
                    <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                    {insight.action && (
                      <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 transition-transform flex-shrink-0">
                        {insight.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Injected AI Panel nicely");
} else {
    console.log("Could not find target block");
}
