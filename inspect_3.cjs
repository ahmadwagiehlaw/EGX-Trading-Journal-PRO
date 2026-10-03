const fs = require('fs');
const ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = ctx.split('\n');
const idx = lines.findIndex(l => l.includes('const depositedInvestment = useMemo'));
console.log(lines.slice(idx, idx + 20).join('\n'));
