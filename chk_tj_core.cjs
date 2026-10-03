const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('كور') || lines[i].includes('Core') || lines[i].includes('ستالايت') || lines[i].includes('Satellite')) {
      console.log(`Line ${i}: ${lines[i]}`);
   }
}
