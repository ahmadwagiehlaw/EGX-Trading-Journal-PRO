const fs = require('fs');
let buf = fs.readFileSync('ActiveTrades.tsx.bak');
console.log('BOM:', buf[0], buf[1], buf[2], buf[3]);
