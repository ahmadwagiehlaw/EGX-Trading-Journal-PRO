const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const sIdx = code.indexOf('export default function ActiveTrades');
console.log(code.slice(sIdx, sIdx + 1000));
