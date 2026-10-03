const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const sIdx = code.indexOf('const updateTransaction = async');
const eIdx = code.indexOf('const updateTrailingStop', sIdx);
console.log(code.slice(sIdx, eIdx));
