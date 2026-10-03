const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const tIdx = code.indexOf('ATR Pill');
console.log(code.slice(tIdx + 2500, tIdx + 4500));
