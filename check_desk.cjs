const fs = require('fs');
const content = fs.readFileSync('src/components/TradingDeskModal.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('EGP')) {
    console.log(`Line ${i}: ${l}`);
  }
});
