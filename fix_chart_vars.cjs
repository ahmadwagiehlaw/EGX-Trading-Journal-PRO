const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/\{minP\.toFixed\(2\)\}/g, "{rawMin.toFixed(2)}");
c = c.replace(/\{maxP\.toFixed\(2\)\}/g, "{rawMax.toFixed(2)}");
c = c.replace(/\{currentStop > minP && \(/g, "{currentStop > rawMin && (");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed minP/maxP references');
