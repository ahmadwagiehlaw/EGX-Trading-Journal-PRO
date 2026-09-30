const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
console.log(c.includes('Trailing Stop Adjustment Input'));
const idx = c.indexOf('{/* Trailing Stop Adjustment Input */}');
if (idx !== -1) {
  console.log(c.slice(idx - 100, idx + 500));
}
