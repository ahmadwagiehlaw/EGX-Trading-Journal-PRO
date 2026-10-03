const fs = require('fs');
const ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = ctx.split('\n');

// Find capitalInvestment calculation
const idx1 = lines.findIndex(l => l.includes('capitalInvestment'));
const idx2 = lines.findIndex(l => l.includes('depositedInvestment'));
console.log('=== Capital calculations ===');
console.log(lines.slice(idx1, idx1 + 15).join('\n'));
console.log('...');
console.log(lines.slice(idx2, idx2 + 10).join('\n'));
