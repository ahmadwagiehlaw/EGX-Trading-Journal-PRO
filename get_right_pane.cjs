const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('AdvancedRealTimeChart'));
console.log(lines.slice(idx - 15, idx + 15).join('\n'));
