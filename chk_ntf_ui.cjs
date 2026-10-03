const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const tIdx = code.indexOf('الوقف المتحرك (ATR)');
console.log(code.slice(tIdx - 500, tIdx + 100));
