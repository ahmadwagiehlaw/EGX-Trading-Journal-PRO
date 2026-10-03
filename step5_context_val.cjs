const fs = require('fs');
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 5. Add to contextValue useMemo
ctx = ctx.replace(
  `  const contextValue = useMemo(() => ({
    isSimulator,
    toggleSimulator,`,
  `  const contextValue = useMemo(() => ({
    isSimulator,
    toggleSimulator,
    coreSatelliteTarget,
    setCoreSatelliteTarget,
    coreStats,`
);

// Update dependencies
ctx = ctx.replace(
  `disciplineScore, loading, commissionRate, isSimulator\n  ]);`,
  `disciplineScore, loading, commissionRate, isSimulator, coreSatelliteTarget, coreStats\n  ]);`
);

fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ contextValue updated');
