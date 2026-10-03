const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tIdx = code.indexOf('activeTradeId');
console.log(code.slice(tIdx - 100, tIdx + 300));
