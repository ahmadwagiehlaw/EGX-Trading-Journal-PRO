const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

console.log("--- Around 1012 ---");
for(let i=1005; i<1020; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
