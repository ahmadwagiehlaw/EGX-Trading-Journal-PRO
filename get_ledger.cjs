const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('سجل صفقات السهم'));
console.log(lines.slice(idx, idx + 100).join('\n'));
