const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('return () => {'));
console.log(lines.slice(idx - 10, idx + 15).join('\n'));
