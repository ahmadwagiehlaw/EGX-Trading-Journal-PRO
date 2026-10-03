const fs = require('fs');
const code = fs.readFileSync('src/utils/calculations.ts', 'utf8');
console.log(code.includes('FIFO') || code.includes('fifo'));
console.log(code.includes('دفعات'));
