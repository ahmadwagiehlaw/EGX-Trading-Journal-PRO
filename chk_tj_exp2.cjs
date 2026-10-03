const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('setExpandedPositionId(');
let next = tIdx;
while (next > -1) {
    console.log(code.slice(next - 50, next + 100));
    next = code.indexOf('setExpandedPositionId(', next + 1);
}
