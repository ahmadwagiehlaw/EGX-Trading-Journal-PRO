const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 810; i < 835; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
