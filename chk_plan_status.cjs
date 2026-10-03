const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = wl.indexOf('حالة الخطة');
console.log(wl.slice(tIdx - 100, tIdx + 1200));
