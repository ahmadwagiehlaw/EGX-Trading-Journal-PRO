const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('openLots.map');
console.log(code.slice(tIdx - 200, tIdx + 400));
