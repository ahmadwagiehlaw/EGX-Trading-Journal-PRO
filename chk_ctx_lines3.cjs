const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const positionToLegacyTrade =')) {
    start = i;
    break;
  }
}
if (start > -1) {
  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i] === '};') {
      end = i;
      break;
    }
  }
  console.log(`Start: ${start+1}, End: ${end+1}`);
} else {
  console.log("Not found.");
}
