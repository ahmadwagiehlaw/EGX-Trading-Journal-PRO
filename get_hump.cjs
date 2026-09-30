const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const handleUpdateMarketPrice'));
console.log(lines.slice(idx, idx + 10).join('\n'));
