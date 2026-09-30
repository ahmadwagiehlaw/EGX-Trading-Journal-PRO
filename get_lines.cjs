const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('Plan vs Reality'));
console.log(lines.slice(Math.max(0, idx - 50), idx + 10).join('\n'));
