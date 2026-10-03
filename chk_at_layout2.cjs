const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const rightCol = code.indexOf('{/* Right Column: Live TradingView Chart */}');
if (rightCol > -1) {
   console.log("Right col starts at:", rightCol);
   console.log(code.slice(rightCol, rightCol + 500));
}

const leftCol = code.indexOf('{/* Left Column: Trailing Stop Engine & Ledger Control */}');
if (leftCol > -1) {
   console.log("Left col starts at:", leftCol);
   console.log(code.slice(leftCol, leftCol + 500));
}
