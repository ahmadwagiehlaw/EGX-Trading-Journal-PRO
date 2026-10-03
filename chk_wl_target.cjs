const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// Find where to insert Time Stop input
const targetIdx = wl.indexOf('<label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">الأهداف (الهدف الأساسي، ثم أهداف التخفيف T2, T3)</label>');

console.log(wl.slice(targetIdx - 500, targetIdx + 200));
