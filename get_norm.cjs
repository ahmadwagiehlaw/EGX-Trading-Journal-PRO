const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('function normalizePosition'));
console.log(lines.slice(idx, idx + 25).join('\n'));
