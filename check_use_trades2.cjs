const fs = require('fs');
const content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('export function useTrade'));
console.log(lines.slice(idx - 5, idx + 10).join('\n'));
