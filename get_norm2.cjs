const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('function normalizePosition'));
console.log(lines.slice(idx + 25, idx + 60).join('\n'));
