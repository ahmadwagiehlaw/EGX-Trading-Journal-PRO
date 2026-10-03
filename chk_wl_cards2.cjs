const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('filteredPlans.map(');
if (tIdx > -1) {
    console.log(code.slice(tIdx, tIdx + 1500));
} else {
    console.log(code.indexOf('plans.map('));
}
