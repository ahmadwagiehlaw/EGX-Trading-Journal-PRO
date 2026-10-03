const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

const tIdx = code.indexOf('const executeSaveFromPending');
console.log(code.slice(tIdx - 100, tIdx + 400));
