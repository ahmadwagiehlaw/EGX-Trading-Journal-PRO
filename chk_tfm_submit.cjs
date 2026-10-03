const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

const sIdx = code.indexOf('const handleSubmit = async');
const eIdx = code.indexOf('} catch (err)', sIdx);
console.log(code.slice(sIdx, eIdx));
