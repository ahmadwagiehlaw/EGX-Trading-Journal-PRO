const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const sIdx = code.indexOf('const addTransaction = async');
const eIdx = code.indexOf('const updateTransaction', sIdx);
console.log(code.slice(sIdx, eIdx));
