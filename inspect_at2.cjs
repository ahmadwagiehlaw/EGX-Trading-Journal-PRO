const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// The file has CRLF vs LF mix issues - just do a string search and replace
const oldCode = at.indexOf('"flex items-center gap-2">');
console.log('Found at:', oldCode);
console.log('Context:', JSON.stringify(at.slice(oldCode - 10, oldCode + 100)));
