const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const handleUpdateTrailingStop = '));
console.log(lines.slice(start, start + 20).join('\n'));
