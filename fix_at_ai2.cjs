const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const aiPanel = `
          {/* Smart Insights Panel (AI Advisor) */}
          {insights.length > 0 && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI)</h3>
              </div>
              <div className="grid gap-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className={\`flex items-start gap-3 p-3 rounded-xl \${
                    insight.type === 'warning' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                    insight.type === 'success' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                    'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }\`}>
                    <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
`;

// It should go right before "          {/* Position Metrics Grid */}" which is wait... I don't have that comment.
// Let's find "الكمية المفتوحة"
const target = '              <div className="text-left">'; // which holds الكمية المفتوحة
const targetIdx = code.indexOf(target);
if (targetIdx > -1) {
    // go back to the closing div of the flex row (the Header)
    const headerEnd = code.lastIndexOf('</div>', targetIdx - 1) + 6;
    code = code.slice(0, headerEnd) + '\n\n' + aiPanel + '\n\n' + code.slice(headerEnd);
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Injected AI Panel under stock data");
} else {
    console.log("Could not find target");
}
