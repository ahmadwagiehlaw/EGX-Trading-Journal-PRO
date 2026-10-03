const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('activeTradeIdProp');
console.log(code.slice(tIdx - 100, tIdx + 300));
