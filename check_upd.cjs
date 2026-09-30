const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('useTradeContext()'));
console.log(lines.slice(idx - 2, idx + 5).join('\n'));
