const fs = require('fs');
const wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const rrrIdx = wl.indexOf("const rrr = calculateRRR(item);");
console.log(wl.slice(rrrIdx, rrrIdx + 500));
