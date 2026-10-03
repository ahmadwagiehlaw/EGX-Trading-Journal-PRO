const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

console.log("--- Around 410 ---");
for(let i=400; i<450; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n--- Around 950 ---");
for(let i=945; i<965; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
