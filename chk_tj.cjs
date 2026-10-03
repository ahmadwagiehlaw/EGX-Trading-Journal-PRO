const fs = require('fs');
const code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
console.log(code.includes('FIFO') || code.includes('fifo') || code.includes('دفعات'));
