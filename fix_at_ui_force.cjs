const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const coreUI = `
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center mt-6">
                  <span className="text-xs font-bold text-slate-500">كمية الكور (Core)</span>
                  {isEditingCoreShares ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-20 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-black px-2 py-1 outline-none text-left"
                        value={coreSharesInput}
                        onChange={e => setCoreSharesInput(e.target.value)}
                        autoFocus
                        dir="ltr"
                      />
                      <button onClick={handleSaveCoreShares} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><CheckCircle className="w-4 h-4"/></button>
                      <button onClick={() => setIsEditingCoreShares(false)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingCoreShares(true)}>
                      <span className="font-mono-num font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        {position?.coreShares || 0} سهم
                      </span>
                      <Pencil className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
`;

const aiPanel = `
          {/* Smart Insights Panel */}
          {insights.length > 0 && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 space-y-3 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI)</h3>
              </div>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className={\`flex items-start gap-3 p-3 rounded-xl \${
                    insight.type === 'warning' ? 'bg-rose-100/50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200' :
                    insight.type === 'success' ? 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200' :
                    'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }\`}>
                    <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                    {insight.action && (
                      <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
                        {insight.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
`;

// Insert both before {/* Partial Transaction Modal */}
const target = "{/* Partial Transaction Modal */}";
const targetIdx = code.indexOf(target);
if (targetIdx > -1) {
    code = code.slice(0, targetIdx) + coreUI + aiPanel + code.slice(targetIdx);
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Injected AI and Core UI forcefully");
}

