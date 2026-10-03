const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('const unsubTrades = onSnapshot(collection(db, getPath(\'trades\'))');
console.log(code.slice(tIdx, tIdx + 1000));
