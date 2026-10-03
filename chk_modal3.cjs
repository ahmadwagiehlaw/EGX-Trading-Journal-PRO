const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const tIdx = code.indexOf('fixed inset-0 z-50 flex items-center justify-center p-4');
console.log(code.slice(tIdx, tIdx + 400));
