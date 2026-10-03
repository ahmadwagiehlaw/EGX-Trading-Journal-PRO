const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

console.log(wl.indexOf('CONFLUENCE_CRITERIA.map'));
console.log(wl.indexOf('CONFLUENCE_CRITERIA.forEach'));
