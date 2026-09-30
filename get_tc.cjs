const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines[419]);
