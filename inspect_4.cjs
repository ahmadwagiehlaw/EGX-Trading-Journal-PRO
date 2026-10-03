const fs = require('fs');
const ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = ctx.split('\n');
const idx = lines.findIndex(l => l.includes('depositedInvestment ='));
console.log(lines.slice(Math.max(0,idx-3), idx + 20).join('\n'));
