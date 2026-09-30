const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('rightPaneView === '));
console.log(lines.slice(idx - 2, idx + 10).join('\n'));
