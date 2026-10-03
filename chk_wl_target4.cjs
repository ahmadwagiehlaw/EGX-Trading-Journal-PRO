const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tStart = wl.indexOf('{/* Target and Stop Inputs */}');
console.log(wl.slice(tStart, tStart + 1200));
