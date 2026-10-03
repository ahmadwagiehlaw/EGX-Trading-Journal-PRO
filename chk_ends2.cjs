const fs = require('fs');

console.log("Settings.tsx End:");
const sLines = fs.readFileSync('src/components/Settings.tsx', 'utf8').split('\n');
for(let i=sLines.length-20; i<sLines.length; i++) console.log(sLines[i]);

console.log("\nTransactionFormModal.tsx End:");
const tLines = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8').split('\n');
for(let i=tLines.length-20; i<tLines.length; i++) console.log(tLines[i]);
