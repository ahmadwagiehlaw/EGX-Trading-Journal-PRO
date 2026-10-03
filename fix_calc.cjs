const fs = require('fs');
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');

calc = calc.replace('txPnL: sim.txPnL || {}', 'txPnL: sim.txPnL || {},\n    openLots: sim.openLots || []');

fs.writeFileSync('src/utils/calculations.ts', calc, 'utf8');
console.log('Exported openLots');
