const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('strategy');
let next = code.indexOf('strategy', tIdx + 1);
while(next > -1) {
    console.log("Found:", code.slice(next - 50, next + 50));
    next = code.indexOf('strategy', next + 1);
}
