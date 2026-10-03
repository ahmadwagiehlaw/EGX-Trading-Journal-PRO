const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

const sIdx = code.indexOf('const rawPayload = {');
const eIdx = code.indexOf('};', sIdx) + 2;

let payload = code.slice(sIdx, eIdx);
// Replace date
payload = payload.replace("date: transactionToEdit ? transactionToEdit.date : Date.now(),", "date: new Date(dateStr).getTime(),");

code = code.slice(0, sIdx) + payload + code.slice(eIdx);
fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log('Fixed date edit payload');
