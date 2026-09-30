const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(/const wonPositions = closedPositions\.filter/g, 'const wonPositions = filteredPositions.filter');
c = c.replace(/const lostPositions = closedPositions\.filter/g, 'const lostPositions = filteredPositions.filter');

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed Analytics won/lost positions');
