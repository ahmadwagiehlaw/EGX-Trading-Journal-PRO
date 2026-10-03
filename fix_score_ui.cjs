const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const oldChecklistUI = `                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-black text-indigo-800 dark:text-indigo-400">قائمة التحقق (Confluence Checklist)</label>
                        <span className={\`text-xs font-black px-2 py-0.5 rounded-md \${
                          calculateScore(selectedPlan) >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                          calculateScore(selectedPlan) >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                        }\`}>
                          جودة الصفقة: {calculateScore(selectedPlan)}%
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {PLAYBOOK_TEMPLATES.find(t => t.name === selectedPlan.strategy)?.checklist.map(item => (
                          <label key={item} className="flex items-start gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={!!selectedPlan.checklist?.[item]}
                              onChange={(e) => {
                                const newChecklist = { ...selectedPlan.checklist };
                                newChecklist[item] = e.target.checked;
                                setSelectedPlan({ ...selectedPlan, checklist: newChecklist });
                              }}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-600 transition-colors cursor-pointer"
                            />
                            <span className={\`text-[11px] font-bold leading-relaxed transition-colors \${
                              selectedPlan.checklist?.[item] 
                                ? 'text-indigo-900 dark:text-indigo-300' 
                                : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                            }\`}>
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>`;

const newChecklistUI = `                      <div className="flex justify-between items-center mb-3">
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
                                setSelectedPlan({ ...selectedPlan, checklist: newChecklist });
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
                      </div>`;

wl = wl.replace(oldChecklistUI, newChecklistUI);
fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Updated Checklist UI in Watchlist Modal');
