const fs = require('fs');
const at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = at.split('\n');
// Find where position details begin — look for the header area with portfolioType
lines.forEach((l, i) => {
  if (l.includes('portfolioType') || l.includes('مركز مفتوح') || l.includes('مركز مغلق') || l.includes('position!.symbol')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
