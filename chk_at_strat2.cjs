const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('strategy');
if (tIdx > -1) {
    console.log(code.slice(tIdx - 100, tIdx + 100));
} else {
    console.log("No strategy found");
}
