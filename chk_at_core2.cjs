const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('setCoreSharesInput');
const sIdx = code.indexOf('setIsEditingCoreShares(true)');
console.log(code.slice(sIdx - 100, sIdx + 200));
