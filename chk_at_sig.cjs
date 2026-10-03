const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const match = code.match(/function ActiveTrades\s*\([^)]*\)\s*\{/);
console.log(match ? match[0] : "Not found!");
