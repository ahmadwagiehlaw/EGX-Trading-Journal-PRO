const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = wl.indexOf('PLAYBOOK_TEMPLATES.find(t => t.name === selectedPlan.strategy)');
if (tIdx > -1) {
    console.log(wl.slice(tIdx - 100, tIdx + 1000));
} else {
    console.log("Not found PLAYBOOK_TEMPLATES.find");
}
