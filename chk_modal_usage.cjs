const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('<TransactionFormModal'));
console.log(lines.slice(idx, idx + 20).join('\n'));
