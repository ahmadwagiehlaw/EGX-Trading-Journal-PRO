const fs = require('fs');

const sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const sLines = sCode.split('\n');
console.log("Settings.tsx End:");
for(let i=sLines.length-15; i<sLines.length; i++) console.log(sLines[i]);

const tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tLines = tCode.split('\n');
console.log("\nTransactionFormModal.tsx End:");
for(let i=tLines.length-30; i<tLines.length; i++) console.log(tLines[i]);
