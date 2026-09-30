const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(/const totalGrossPnL = closedPositions\.reduce/g, 'const totalGrossPnL = filteredPositions.reduce');
c = c.replace(/const totalCommissionPaid = closedPositions\.reduce/g, 'const totalCommissionPaid = filteredPositions.reduce');
c = c.replace(/const totalNetPnL = closedPositions\.reduce/g, 'const totalNetPnL = filteredPositions.reduce');

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed Analytics PnL sums');
