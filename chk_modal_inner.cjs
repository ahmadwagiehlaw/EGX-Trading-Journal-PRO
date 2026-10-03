const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('Right Column: Parameters & Entry Range');
console.log(code.slice(tIdx - 100, tIdx + 300));
