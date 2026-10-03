const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const sIdx = code.indexOf('const handleSubmit = async');
const eIdx = code.indexOf('addPosition(', sIdx) + 400;
console.log(code.slice(sIdx, eIdx));
