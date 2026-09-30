const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(/const positionsWithRealizedPnL = useMemo\(\(\) => \{\n      return filteredPositions\.filter\(pos => \{\n        const metrics = computePositionMetrics\(pos, commissionRate\);\n        return pos\.status === 'closed' \|\| metrics\.isFullyClosed;\n      \}\);\n    \}, \[filteredPositions, commissionRate\]\);/g,
`const positionsWithRealizedPnL = useMemo(() => {
      return filteredPositions.filter(pos => {
        const metrics = computePositionMetrics(pos, commissionRate);
        return pos.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0;
      });
    }, [filteredPositions, commissionRate]);`);

c = c.replace(/const positionsWithRealizedPnL = useMemo\(\(\) => \{\n      return filteredPositions\.filter\(pos => \{\n        const metrics = computePositionMetrics\(pos, commissionRate\);\n        return pos\.status === 'closed' \|\| metrics\.isFullyClosed;\n      \}\);\n    \}, \[positions, commissionRate\]\);/g,
`const positionsWithRealizedPnL = useMemo(() => {
      return filteredPositions.filter(pos => {
        const metrics = computePositionMetrics(pos, commissionRate);
        return pos.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0;
      });
    }, [filteredPositions, commissionRate]);`);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed positionsWithRealizedPnL logic in Analytics');
