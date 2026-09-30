const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
if (idx !== -1) {
  console.log('Found it at line', idx);
} else {
  console.log('Not found');
}
