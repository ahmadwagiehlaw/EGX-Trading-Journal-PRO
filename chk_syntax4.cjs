const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('{/* Quick Partial Transactions Row */}'));
console.log(lines.slice(idx - 10, idx + 10).join('\n'));
