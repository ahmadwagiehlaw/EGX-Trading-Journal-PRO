const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Fix txModal sellAll
c = c.replace(/setTxModal\('sellAll'\)/g, "setTxModal('sell')");
c = c.replace(/txModal === 'sellAll'/g, "txModal === 'sell'");

// Remove unused imports/vars
c = c.replace(/Target,\n/g, '');
c = c.replace(/closePosition/g, '');
c = c.replace(/, onClose/g, '');

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed ActiveTrades TS errors');
