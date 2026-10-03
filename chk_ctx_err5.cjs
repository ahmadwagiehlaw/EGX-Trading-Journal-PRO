const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = code.split('\n');

console.log("--- Top ---");
for(let i=0; i<25; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n--- Around 280 ---");
for(let i=270; i<300; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
