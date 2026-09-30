const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

c = c.replace(/const equityData = closedPositions\.sort/g, 'const computedEquityData = closedPositions.sort');

fs.writeFileSync('src/components/Dashboard.tsx', c, 'utf8');
console.log('Fixed computedEquityData');
