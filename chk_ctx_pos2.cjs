const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export interface TickerPosition')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    for(let j=i; j<i+20; j++) console.log(lines[j]);
    break;
  }
}
