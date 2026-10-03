const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tIdx = code.indexOf('TradeJournal');
console.log(code.slice(tIdx - 200, tIdx + 400));
