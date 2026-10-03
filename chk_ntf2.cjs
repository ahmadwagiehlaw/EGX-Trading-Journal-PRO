const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = code.split('\n');
for(let i=0; i<40; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
