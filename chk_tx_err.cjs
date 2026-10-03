const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 440; i < 460; i++) {
   console.log(`${i+1}: ${lines[i]}`);
}
for (let i = lines.length - 20; i < lines.length; i++) {
   console.log(`${i+1}: ${lines[i]}`);
}
