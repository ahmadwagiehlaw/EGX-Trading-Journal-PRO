const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('const [marketPriceInput')) {
    console.log(`Line ${i}: ${l}`);
  }
});
