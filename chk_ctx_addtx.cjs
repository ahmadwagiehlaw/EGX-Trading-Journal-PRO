const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('const addTransaction = async');
console.log(code.slice(tIdx, tIdx + 1000));
