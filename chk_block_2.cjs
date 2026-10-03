const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const startIdx = wl.indexOf('PLAYBOOK_TEMPLATES.find(t => t.name === selectedPlan.strategy)');
console.log(wl.slice(startIdx - 50, startIdx + 2000));
