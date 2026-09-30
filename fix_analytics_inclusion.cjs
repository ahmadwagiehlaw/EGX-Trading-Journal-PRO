const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(/const closedPositions = useMemo\(\(\) => \{\n      return filteredPositions\.filter\(p => \{\n        const metrics = computePositionMetrics\(p, commissionRate\);\n        return p\.status === 'closed' \|\| metrics\.isFullyClosed;\n      \}\);\n    \}, \[filteredPositions, commissionRate\]\);/,
`const positionsWithRealizedPnL = useMemo(() => {
      return filteredPositions.filter(p => {
        const metrics = computePositionMetrics(p, commissionRate);
        return p.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0;
      });
    }, [filteredPositions, commissionRate]);`);

c = c.replace(/closedPositions/g, 'positionsWithRealizedPnL');

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed Analytics PnL inclusion');
