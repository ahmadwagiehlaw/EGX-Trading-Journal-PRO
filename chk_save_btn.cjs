const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const saveIdx = wl.indexOf('onClick={handleSavePlan}');
console.log(wl.slice(saveIdx - 200, saveIdx + 400));
