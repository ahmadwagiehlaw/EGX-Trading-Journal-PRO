const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const modalIdx = wl.indexOf('selectedPlan && (');
console.log(wl.slice(modalIdx - 100, modalIdx + 500));
