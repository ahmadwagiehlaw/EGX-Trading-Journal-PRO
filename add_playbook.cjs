const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// 1. Add PLAYBOOK_TEMPLATES at the top after imports
const importsRegex = /import \{ useTrades, type Plan \} from '\.\.\/context\/TradeContext';/;
const playbookDef = `import { useTrades, type Plan } from '../context/TradeContext';

const PLAYBOOK_TEMPLATES = [
  {
    name: 'اختراق منطقة تذبذب (VCP / Breakout)',
    checklist: [
      'حجم تداول أعلى من المتوسط بـ 150% عند الاختراق',
      'تقلص التذبذب (Volatility Contraction) قبل الاختراق',
      'السهم يتداول فوق متوسط 50 و 200 يوم',
      'السوق في اتجاه عام صاعد (Uptrend)'
    ]
  },
  {
    name: 'الشراء عند الارتداد (Pullback / Moving Average Bounce)',
    checklist: [
      'تراجع السعر نحو دعم أو متوسط (20/50) دون كسره بقوة',
      'انخفاض حجم التداول أثناء التراجع (Dry up in volume)',
      'ظهور شمعة انعكاسية (Hammer / Engulfing) عند الدعم',
      'احتمالية العائد للمخاطرة (RRR) أعلى من 2:1'
    ]
  },
  {
    name: 'استراتيجية الزخم (Momentum / Gap Up)',
    checklist: [
      'قفزة سعرية (Gap Up) مصحوبة بحجم تداول ضخم',
      'القفزة ناتجة عن أخبار جوهرية أو أرباح ممتازة',
      'السهم أغلق بالقرب من أعلى سعر في الجلسة',
      'السهم في أعلى مستوياته (52-Week High)'
    ]
  },
  {
    name: 'استراتيجية مخصصة (Custom)',
    checklist: []
  }
];`;
code = code.replace(importsRegex, playbookDef);

// 2. Add score calculation helper in component
const helperRegex = /const calculateRRR = \(plan: Plan\) => \{/;
const scoreHelper = `const calculateScore = (plan: Plan) => {
    if (!plan.checklist) return 0;
    const items = Object.values(plan.checklist);
    if (items.length === 0) return 0;
    const passed = items.filter(Boolean).length;
    return Math.round((passed / items.length) * 100);
  };

  const calculateRRR = (plan: Plan) => {`;
code = code.replace(helperRegex, scoreHelper);

// 3. Replace the strategy input with the Playbook UI
const strategyInputRegex = /<div>\s*<label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1\.5">الاستراتيجية \/ سبب الدخول<\/label>\s*<input\s*type="text"\s*value=\{selectedPlan\.strategy\}\s*onChange=\{\(e\) => setSelectedPlan\(\{...selectedPlan, strategy: e\.target\.value\}\)\}\s*className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"\s*placeholder="مثال: اختراق مع فوليوم عالي وإعادة اختبار"\s*\/>\s*<\/div>/;

const playbookUI = `<div>
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    استراتيجية التداول (Playbook)
                  </label>
                  <select 
                    value={selectedPlan.strategy} 
                    onChange={(e) => {
                      const strat = e.target.value;
                      const template = PLAYBOOK_TEMPLATES.find(t => t.name === strat);
                      const initialChecklist: Record<string, boolean> = {};
                      if (template && template.checklist.length > 0) {
                        template.checklist.forEach(item => initialChecklist[item] = false);
                      }
                      setSelectedPlan({...selectedPlan, strategy: strat, checklist: initialChecklist, setupScore: 0});
                    }} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none mb-3"
                  >
                    <option value="">-- اختر استراتيجية --</option>
                    {PLAYBOOK_TEMPLATES.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                    {!PLAYBOOK_TEMPLATES.some(t => t.name === selectedPlan.strategy) && selectedPlan.strategy && (
                      <option value={selectedPlan.strategy}>{selectedPlan.strategy}</option>
                    )}
                  </select>

                  {/* Confluence Scoring Checklist */}
                  {selectedPlan.strategy && PLAYBOOK_TEMPLATES.find(t => t.name === selectedPlan.strategy)?.checklist.length ? (
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
                      <div className="flex justify-between items-center mb-3">
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
                                const newChecklist = { ...selectedPlan.checklist, [item]: e.target.checked };
                                const items = Object.values(newChecklist);
                                const passed = items.filter(Boolean).length;
                                const newScore = Math.round((passed / items.length) * 100);
                                setSelectedPlan({
                                  ...selectedPlan, 
                                  checklist: newChecklist,
                                  setupScore: newScore
                                });
                              }}
                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className={\`text-xs font-bold leading-relaxed transition-colors \${!!selectedPlan.checklist?.[item] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}\`}>
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : selectedPlan.strategy === 'استراتيجية مخصصة (Custom)' && (
                    <input 
                      type="text"
                      onChange={(e) => setSelectedPlan({...selectedPlan, strategy: e.target.value})}
                      placeholder="اكتب اسم استراتيجيتك المخصصة..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                    />
                  )}
                </div>`;
code = code.replace(strategyInputRegex, playbookUI);

// 4. Update the card view to show setupScore
const cardViewRegex = /<h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">\s*\{item\.symbol\}\s*<\/h3>/;
const cardViewWithScore = `<h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                      {item.symbol}
                      {item.setupScore !== undefined && (
                        <span className={\`text-[9px] px-1.5 py-0.5 rounded border \${
                          item.setupScore >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800' :
                          item.setupScore >= 50 ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800' :
                          'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800'
                        }\`} title="جودة الخطة (Setup Score)">
                          {item.setupScore}% ⭐️
                        </span>
                      )}
                    </h3>`;
code = code.replace(cardViewRegex, cardViewWithScore);

fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
console.log('Playbook UI added');
