const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const uiStart = wl.indexOf('{/* Confluence Scoring Checklist */}');
const endStr = 'استراتيجية مخصصة (Custom)\' && (';
const uiEndBlock = wl.indexOf(')}', wl.indexOf(endStr, uiStart)) + 2;

const replacement = `{/* Confluence Matrix UI */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[11px] font-black text-indigo-800 dark:text-indigo-400">نقاط قوة الصفقة (Confluence Score)</label>
                      <span className={\`text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1 \${
                        calculateScore(selectedPlan) >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        calculateScore(selectedPlan) >= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      }\`}>
                        {calculateScore(selectedPlan) < 6 && '⚠️'}
                        جودة الصفقة: {calculateScore(selectedPlan)} / 10
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {CONFLUENCE_CRITERIA.map(crit => (
                        <label key={crit.id} className="flex items-start gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={!!selectedPlan.checklist?.[crit.id]}
                            onChange={(e) => {
                              const newChecklist = { ...selectedPlan.checklist };
                              newChecklist[crit.id] = e.target.checked;
                              
                              let tempPlan = { ...selectedPlan, checklist: newChecklist };
                              if (calculateScore(tempPlan) < 6 && tempPlan.status === 'ready') {
                                tempPlan.status = 'waiting';
                              }
                              
                              setSelectedPlan(tempPlan);
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 transition-colors cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className={\`text-[11px] font-bold leading-relaxed transition-colors \${
                              selectedPlan.checklist?.[crit.id] 
                                ? 'text-indigo-900 dark:text-indigo-300' 
                                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                            }\`}>
                              {crit.label}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{crit.points} {crit.points === 1 ? 'نقطة' : 'نقاط'}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {selectedPlan.strategy === 'استراتيجية مخصصة (Custom)' && (
                    <input 
                      type="text"
                      onChange={(e) => setSelectedPlan({...selectedPlan, strategy: e.target.value})}
                      placeholder="اكتب اسم استراتيجيتك المخصصة..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                    />
                  )}`;

if (uiStart > -1 && uiEndBlock > -1) {
    wl = wl.slice(0, uiStart) + replacement + wl.slice(uiEndBlock);
    console.log("Replaced UI block successfully.");
} else {
    console.log("Failed to find UI block boundaries");
}

const cStart = wl.indexOf('const calculateScore = (plan: Plan) => {');
const cEnd = wl.indexOf('};', cStart) + 2;

const newCalc = `const calculateScore = (plan: Plan) => {
    if (!plan.checklist) return 0;
    let score = 0;
    CONFLUENCE_CRITERIA.forEach(crit => {
      if (plan.checklist?.[crit.id]) {
        score += crit.points;
      }
    });
    return score; // Max 10
  };`;

if (cStart > -1) {
    wl = wl.slice(0, cStart) + newCalc + wl.slice(cEnd);
    console.log("Replaced calculateScore successfully.");
}

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
