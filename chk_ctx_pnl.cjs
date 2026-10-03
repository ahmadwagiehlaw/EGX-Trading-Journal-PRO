const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('pnl: raw.pnl');
let next = tIdx;
while(next > -1) {
    console.log(code.slice(next, next + 100));
    next = code.indexOf('pnl: raw.pnl', next + 1);
}
