const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// 1. Add CONFLUENCE_CRITERIA
const criteriaStr = `const CONFLUENCE_CRITERIA = [
  { id: 'market_trend', label: 'السوق في اتجاه عام صاعد (Uptrend)', points: 1 },
  { id: 'sector_trend', label: 'قطاع السهم إيجابي وتدخله سيولة', points: 1 },
  { id: 'above_ma', label: 'السهم يتداول فوق المتوسطات المهمة (20/50)', points: 1 },
  { id: 'clear_setup', label: 'نموذج فني واضح (اختراق قوي أو ارتداد من دعم)', points: 2 },
  { id: 'volume_confirm', label: 'تأكيد بأحجام التداول (سيولة شرائية أو جفاف بيعي)', points: 2 },
  { id: 'catalyst', label: 'وجود محفز (أخبار جوهرية إيجابية أو أرباح ممتازة)', points: 1 },
  { id: 'rrr_ok', label: 'العائد للمخاطرة (R:R) جذاب وأكبر من 1:2', points: 2 },
];\n`;

wl = wl.replace("const PLAYBOOK_TEMPLATES = [", criteriaStr + "\nconst PLAYBOOK_TEMPLATES = [");

// 2. Empty old checklists
wl = wl.replace(/checklist:\s*\[[\s\S]*?\]/g, 'checklist: []');

// 3. Update calculateScore
const calcStart = wl.indexOf('const calculateScore = (plan: Plan) => {');
const calcEnd = wl.indexOf('};', calcStart) + 2;
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
wl = wl.slice(0, calcStart) + newCalc + wl.slice(calcEnd);

// 4. Update Checklist UI
const uiStart = wl.indexOf('{/* Confluence Scoring Checklist */}');
const uiEnd = wl.indexOf('{/* Entry Zone Inputs', uiStart);
const uiEndBlock = wl.lastIndexOf('</div>', uiEnd) + 6;

const newUI = `{/* Confluence Matrix UI */}
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
                      className="w-full mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
                
                `;

wl = wl.slice(0, uiStart) + newUI + wl.slice(uiEnd);

// 5. Update Trigger Toggle
const tStart = wl.indexOf('<label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2">حالة الخطة</label>');
const tEnd = wl.indexOf('</div>', wl.indexOf('جاهزة للتنفيذ', tStart)) + 6;

const newToggle = `<label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2 flex justify-between items-center">
                    <span>حالة الخطة</span>
                    {calculateScore(selectedPlan) < 6 && (
                      <span className="text-[9px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">يجب أن تكون الجودة 6 فما فوق للتنفيذ</span>
                    )}
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(prev => prev ? {...prev, status: 'waiting'} : null)}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'waiting'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                    >
                      <span>⏳ قيد التجهيز</span>
                      <span className="text-[10px] opacity-80">(Setup)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (calculateScore(selectedPlan) >= 6) {
                          setSelectedPlan(prev => prev ? {...prev, status: 'ready'} : null);
                        }
                      }}
                      disabled={calculateScore(selectedPlan) < 6}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 \${
                        selectedPlan.status === 'ready'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : calculateScore(selectedPlan) < 6 
                            ? 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }\`}
                      title={calculateScore(selectedPlan) < 6 ? "جودة الصفقة ضعيفة (أقل من 6). لا يمكن تفعيل الخطة." : "تفعيل الخطة"}
                    >
                      <span>{calculateScore(selectedPlan) < 6 ? '🔒' : '🎯'} جاهزة للتنفيذ</span>
                      <span className="text-[10px] opacity-80">(Trigger)</span>
                    </button>
                  </div>`;

wl = wl.slice(0, tStart) + newToggle + wl.slice(tEnd);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log("All done perfectly!");
