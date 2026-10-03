const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 285; i <= 295; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
