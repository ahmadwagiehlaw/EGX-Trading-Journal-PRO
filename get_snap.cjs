const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('onSnapshot(q'));
console.log(lines.slice(idx + 10, idx + 40).join('\n'));
