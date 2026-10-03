const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('Satellite') || lines[i].includes('ستالايت') || lines[i].includes('كور')) {
      console.log(`Line ${i}: ${lines[i]}`);
   }
}
