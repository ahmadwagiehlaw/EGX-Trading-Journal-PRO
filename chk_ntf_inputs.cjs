const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = code.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('input')) {
    console.log(`Line ${i}: ${lines[i]}`);
    count++;
    if(count > 10) break;
  }
}
