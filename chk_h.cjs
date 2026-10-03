const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('h-[85vh]');
console.log(code.slice(tIdx - 100, tIdx + 200));
