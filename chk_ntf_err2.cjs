const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const tIdx = code.indexOf('setDateStr');
console.log("First index:", tIdx);
const nextIdx = code.indexOf('setDateStr', tIdx + 1);
console.log("Second index:", nextIdx);
