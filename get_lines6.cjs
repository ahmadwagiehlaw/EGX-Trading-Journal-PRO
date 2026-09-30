const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('الحالي') || l.includes('المبدئي') || l.includes('Plan vs Reality')) {
    console.log(`Line ${i}: ${l}`);
  }
});
