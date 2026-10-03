const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('interface TradeContextType'));
if (idx !== -1) {
  console.log(lines.slice(idx, idx + 40).join('\n'));
} else {
  console.log('Not found');
}
