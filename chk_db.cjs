const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

console.log('Searching for collection(db, "trades"):', c.match(/collection\(db, 'trades'\)/g)?.length);
console.log('Searching for doc(db, "trades", id):', c.match(/doc\(db, 'trades', /g)?.length);
