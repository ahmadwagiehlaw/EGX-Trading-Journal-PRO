const fs = require('fs');
const code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = code.split('\n');
for(let i=180; i<205; i++) console.log(`${i+1}: ${lines[i]}`);
