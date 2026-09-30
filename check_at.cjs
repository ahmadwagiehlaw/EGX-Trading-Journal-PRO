const fs = require('fs');
const content = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<ActiveTrades')) {
    console.log(`Line ${i}: ${l}`);
  }
});
