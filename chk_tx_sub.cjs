const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tIdx = code.indexOf('const handleSubmit');
console.log(code.slice(tIdx, tIdx + 1200));
