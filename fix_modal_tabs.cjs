const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// 1. Add state variable inside Watchlist component (or better, inside the modal scope).
// The cleanest is just replacing the Left Column directly and using a local state, 
// but since this is inside the return of Watchlist, we need the state at the top.
if (!code.includes('const [modalLeftTab, setModalLeftTab]')) {
    code = code.replace("const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);", 
        "const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n  const [modalLeftTab, setModalLeftTab] = useState<'updates' | 'chart'>('updates');");
}

const leftColStart = code.indexOf('{/* Left Column: Updates Feed */}');
const leftColEnd = code.indexOf('{/* Modal Footer */}');
const leftColBlock = code.slice(leftColStart, leftColEnd);

const newLeftCol = `{/* Left Column: Updates Feed & Chart */}
              <div className="flex-1 flex flex-col min-h-[400px] border-r border-slate-100 dark:border-slate-800">
                <div className="flex bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-2 gap-2">
                  <button
                    onClick={() => setModalLeftTab('updates')}
                    className={\`flex-1 py-2 text-xs font-black rounded-lg transition-colors \${modalLeftTab === 'updates' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                  >
                    سجل الملاحظات
                  </button>
                  <button
                    onClick={() => setModalLeftTab('chart')}
                    className={\`flex-1 py-2 text-xs font-black rounded-lg transition-colors flex justify-center items-center gap-1.5 \${modalLeftTab === 'chart' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    الشارت المباشر
                  </button>
                </div>
                
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-900">
                  {modalLeftTab === 'updates' ? (
                    <div className="absolute inset-0 overflow-y-auto">
                      <PlanUpdatesFeed 
                        updates={selectedPlan.updates || []} 
                        onChange={(updates) => setSelectedPlan({...selectedPlan, updates})}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <AdvancedRealTimeChart
                        symbol={\`EGX:\${selectedPlan.symbol || 'COMI'}\`}
                        theme="dark"
                        autosize
                        allow_symbol_change={false}
                        hide_top_toolbar={false}
                        hide_legend={false}
                        save_image={true}
                        timezone="Africa/Cairo"
                        locale="ar_AE"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            `;

code = code.replace(leftColBlock, newLeftCol);

// Remove the old 'فتح الشارت' button in the Right Column Form header since we now have it in tabs
// Let's find it.
const chartBtnStart = code.indexOf('<a');
const chartBtnEnd = code.indexOf('</a>', chartBtnStart) + 4;
const possibleChartBtn = code.slice(chartBtnStart, chartBtnEnd);
if (possibleChartBtn.includes('فتح الشارت')) {
    code = code.replace(possibleChartBtn, '');
}

fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
console.log("Left Column replaced and Chart embedded");
