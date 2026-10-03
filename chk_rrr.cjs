const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const rrrIndex = wl.indexOf('{/* Live RRR & Max Shares Auto-Calculation */}');
const context = wl.slice(rrrIndex - 200, rrrIndex + 600);
console.log(context);
