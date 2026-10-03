const fs = require('fs');
// Check UniversalTradeModal - this seems to be where portfolio selection lives
const utm = fs.readFileSync('src/components/UniversalTradeModal.tsx', 'utf8');
const lines = utm.split('\n');
lines.forEach((l, i) => {
  if (l.includes("portfolio") || l.includes("استثمار") || l.includes("مضاربة") || l.includes("specul")) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
