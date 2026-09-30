const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/Target,\s*/g, '');
c = c.replace(/const stopPercent = 0;\s*\/\/\s*stop is at 0%\n/g, '');
c = c.replace(/const targetPercent = 100;\s*\/\/\s*target is at 100%\n/g, '');

c = c.replace(/setTxModal\('sellAll'\)/g, "setTxModal('sell')");
c = c.replace(/txModal === 'sellAll'/g, "txModal === 'sell'");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed more TS errors');
