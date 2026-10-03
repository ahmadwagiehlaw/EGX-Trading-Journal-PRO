const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('export default function TradesJournal');
console.log(code.slice(tIdx, tIdx + 1000));
