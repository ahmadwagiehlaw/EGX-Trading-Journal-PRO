const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

const sIdx = code.indexOf('const handleSubmit = async');
const eIdx = code.indexOf('if (transactionToEdit)', sIdx) + 500;
console.log(code.slice(sIdx, eIdx));
