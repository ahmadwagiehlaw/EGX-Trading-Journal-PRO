const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 280; i < 330; i++) {
  if (lines[i].includes('function positionToLegacyTrade')) {
    console.log(`Start at line ${i+1}`);
  }
  if (lines[i] === '}') {
    console.log(`End at line ${i+1}`);
  }
}
