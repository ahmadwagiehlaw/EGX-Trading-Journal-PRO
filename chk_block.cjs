const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const startIdx = wl.indexOf('{PLAYBOOK_TEMPLATES.find(t => t.name === selectedPlan.strategy)?.checklist.length');
const endIdx = wl.indexOf(')}', wl.indexOf('استراتيجية مخصصة (Custom)\' && (', startIdx)) + 2;

console.log(wl.slice(startIdx, endIdx));
