const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const tIdx = code.indexOf('{/* Quick Partial Transactions Row */}');
console.log(code.slice(tIdx - 1000, tIdx + 500));
