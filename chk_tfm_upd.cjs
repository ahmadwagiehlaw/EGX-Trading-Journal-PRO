const fs = require('fs');
let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tIdx = tCode.indexOf('updateTransaction(');
console.log(tCode.slice(tIdx - 100, tIdx + 200));
