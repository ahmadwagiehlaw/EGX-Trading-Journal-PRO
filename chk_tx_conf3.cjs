const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

const tIdx = code.indexOf('window.confirm');
if (tIdx > -1) {
    console.log(code.slice(tIdx - 200, tIdx + 200));
}
