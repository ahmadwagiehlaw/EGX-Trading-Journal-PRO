const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = code.split('\n');

for(let i=30; i<60; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
