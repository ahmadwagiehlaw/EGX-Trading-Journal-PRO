const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const start = code.indexOf('{/* Header / Ticker Summary */}');
console.log(code.slice(start, start + 3500));
