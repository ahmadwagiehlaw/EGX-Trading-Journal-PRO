const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('<TradeContext.Provider value={{');
console.log(code.slice(tIdx, tIdx + 1000));
