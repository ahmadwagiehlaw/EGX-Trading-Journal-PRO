const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const lines = code.split('\n');

console.log("--- Around 446 ---");
for(let i=440; i<450; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n--- Around 561 ---");
for(let i=555; i<565; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
