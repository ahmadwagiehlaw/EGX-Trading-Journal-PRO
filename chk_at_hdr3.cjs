const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('{/* Header / Ticker Summary */}');
console.log(code.slice(tIdx + 3000, tIdx + 4500));
