const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = wl.indexOf('CONFLUENCE_CRITERIA.map');
console.log(wl.slice(tIdx + 1100, tIdx + 3000));
