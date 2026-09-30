const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
console.log(lines.slice(start - 5, start + 30).join('\n'));
