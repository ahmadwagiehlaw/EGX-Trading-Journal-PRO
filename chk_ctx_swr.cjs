const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setWeeklyReviews')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
