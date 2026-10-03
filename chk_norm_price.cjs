const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('currentMarketPrice: raw.currentMarketPrice'));
if (idx !== -1) {
    console.log(lines.slice(idx - 5, idx + 5).join('\n'));
} else {
    console.log('NOT FOUND!');
}
