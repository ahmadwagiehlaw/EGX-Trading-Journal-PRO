const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('{/* Left Column: Trailing Stop Engine & Ledger Control */}'));
console.log(lines.slice(idx - 5, idx + 10).join('\n'));
