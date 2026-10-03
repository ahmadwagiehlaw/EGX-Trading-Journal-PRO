const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('Left Column: Updates Feed');
console.log(code.slice(tIdx - 100, tIdx + 500));
