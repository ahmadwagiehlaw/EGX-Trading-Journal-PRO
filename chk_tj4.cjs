const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 80; i < 150; i++) {
  if(lines[i].includes('export default')) {
      console.log(`Line ${i}: ${lines[i]}`);
      for(let j=i+1; j<i+10; j++) console.log(lines[j]);
  }
}
