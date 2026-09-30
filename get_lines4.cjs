const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('السهم (')) {
    console.log(lines.slice(Math.max(0, i - 2), i + 2).join('\n'));
    console.log('---');
  }
});
