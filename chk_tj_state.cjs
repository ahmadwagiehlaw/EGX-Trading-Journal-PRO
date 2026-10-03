const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('const [activeTradeId');
console.log(code.slice(tIdx, tIdx + 300));
