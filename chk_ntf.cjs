const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const sIdx = code.indexOf('const [sharesStr, setSharesStr]');
console.log(code.slice(sIdx - 100, sIdx + 1000));
