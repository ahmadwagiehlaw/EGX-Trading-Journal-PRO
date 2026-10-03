const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('interface TickerPosition'));
console.log(lines.slice(idx, idx + 20).join('\n'));
