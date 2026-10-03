const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const oldModalClass = 'className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"';

const newModalClass = 'className={`w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] transition-all duration-500 ease-out ${modalLeftTab === \'chart\' ? \'max-w-[95vw] lg:max-w-7xl\' : \'max-w-[95vw] lg:max-w-5xl\'}`}';

if (code.includes(oldModalClass)) {
    code = code.replace(oldModalClass, newModalClass);
    fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
    console.log("Replaced modal wrapper class successfully.");
} else {
    console.log("Could not find the exact oldModalClass string.");
}
