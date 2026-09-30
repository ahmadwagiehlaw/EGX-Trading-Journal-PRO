const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const fetchTrades = () =>'));
console.log(lines.slice(idx, idx + 30).join('\n'));
