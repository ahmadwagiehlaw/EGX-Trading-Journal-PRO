const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('useState<string | null>(null)');
console.log(code.slice(tIdx - 50, tIdx + 300));
