const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf("onSnapshot(collection(db, 'trades')");
console.log(code.slice(tIdx - 100, tIdx + 1000));
