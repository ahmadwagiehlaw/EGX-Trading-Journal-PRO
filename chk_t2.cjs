const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const t2Index = wl.indexOf('value={selectedPlan.target || \'\'}');
const t2Context = wl.slice(t2Index - 200, t2Index + 500);
console.log(t2Context);
