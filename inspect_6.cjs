const fs = require('fs');
const ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = ctx.split('\n');
// Check the deposited/capital memoization (line 532)
console.log(lines.slice(531, 575).join('\n'));
