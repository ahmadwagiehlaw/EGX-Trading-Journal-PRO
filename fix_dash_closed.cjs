const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

c = c.replace(/const closedPositions = positions\.filter\(p => \{\n      const metrics = computePositionMetrics\(p\);\n      return p\.status === 'closed' \|\| metrics\.isFullyClosed;\n    \}\);/,
`const closedPositions = filteredPositions.filter(p => {
      const metrics = computePositionMetrics(p);
      return p.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0;
    });`);

fs.writeFileSync('src/components/Dashboard.tsx', c, 'utf8');
console.log('Fixed Dashboard closedPositions');
