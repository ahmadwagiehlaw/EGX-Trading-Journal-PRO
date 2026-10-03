const fs = require('fs');
const ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// Find where deposited/capital are calculated
const matches = [];
const lines = ctx.split('\n');
lines.forEach((l, i) => {
  if (l.includes('depositedInvestment') || l.includes('capitalInvestment') || l.includes('totalOpenCapital')) {
    matches.push(`${i+1}: ${l.trim()}`);
  }
});
console.log(matches.slice(0,25).join('\n'));
