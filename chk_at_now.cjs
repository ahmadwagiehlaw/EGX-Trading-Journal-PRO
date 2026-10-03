const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

console.log(code.length);
console.log(code.indexOf('generateInsights'));
console.log(code.indexOf('coreShares'));
