const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('convertPlanToPosition(') || lines[i].includes('convertPlanToPosition')) {
    console.log(`Line ${i}: ${lines[i]}`);
  }
}
