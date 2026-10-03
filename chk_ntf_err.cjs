const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 115; i < 135; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
