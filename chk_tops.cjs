const fs = require('fs');

console.log("--- Settings.tsx top ---");
const setLines = fs.readFileSync('src/components/Settings.tsx', 'utf8').split('\n');
for(let i=0; i<30; i++) console.log(setLines[i]);

console.log("--- TransactionFormModal.tsx top ---");
const txLines = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8').split('\n');
for(let i=0; i<40; i++) console.log(txLines[i]);
