const fs = require('fs');
let stocks = fs.readFileSync('src/data/egxStocks.ts', 'utf8');
console.log(stocks.slice(0, 1500));
