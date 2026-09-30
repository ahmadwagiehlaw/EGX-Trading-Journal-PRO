const fs = require('fs');
const content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf16le');
fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Restored ActiveTrades.tsx from bak');
