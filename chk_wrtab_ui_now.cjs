const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

const tIdx = code.indexOf('<div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">');
console.log(code.slice(tIdx, tIdx + 1500));
