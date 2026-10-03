const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const searchStr = `className="flex items-center gap-2">\r\n                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>\r\n                  <span className={\`px-2.5 py-0.5 rounded-lg text-xs font-black border \${\r\n                    metrics!.isOpen \r\n                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' \r\n                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'\r\n                  }\`}>\r\n                    {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}\r\n                  </span>\r\n                </div>`;

const replaceStr = `className="flex items-center gap-2 flex-wrap">\r\n                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>\r\n                  <span className={\`px-2.5 py-0.5 rounded-lg text-xs font-black border \${\r\n                    metrics!.isOpen \r\n                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' \r\n                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'\r\n                  }\`}>\r\n                    {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}\r\n                  </span>\r\n                  {position!.portfolioType === 'investment' && metrics!.isOpen && (\r\n                    <button\r\n                      onClick={async () => {\r\n                        const newAlloc = position!.coreAllocation === 'satellite' ? 'core' : 'satellite';\r\n                        await updatePosition(position!.id, { coreAllocation: newAlloc });\r\n                      }}\r\n                      className={\`px-2.5 py-0.5 rounded-lg text-xs font-black border transition-all \${\r\n                        position!.coreAllocation === 'satellite'\r\n                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'\r\n                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'\r\n                      }\`}\r\n                      title="اضغط للتبديل بين Core (أساسي) وSatellite (تكتيكي)"\r\n                    >\r\n                      {position!.coreAllocation === 'satellite' ? '🛰 Satellite' : '🏛 Core'}\r\n                    </button>\r\n                  )}\r\n                </div>`;

if (!at.includes(searchStr)) {
  console.log("Search string NOT found — checking for partial match...");
  const partial = `"flex items-center gap-2">`;
  const idx = at.indexOf(partial);
  console.log("Partial idx:", idx);
  console.log("Around it:", JSON.stringify(at.slice(idx - 20, idx + 500)));
} else {
  at = at.replace(searchStr, replaceStr);
  fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
  console.log("✓ Replaced successfully");
}
