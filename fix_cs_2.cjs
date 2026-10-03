const fs = require('fs');

// 2. Fix coreStats useMemo in TradeContext to use coreShares instead of coreAllocation
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const oldCoreStats = `  // --- Core & Satellite Computed Stats ---
  const coreStats = useMemo(() => {
    // Only look at ACTIVE investment positions with open shares
    const investmentPositions = positions.filter(p => p.portfolioType === 'investment' && p.status === 'active');
    
    let coreCapital = 0;
    let satelliteCapital = 0;

    investmentPositions.forEach(pos => {
      const metrics = computePositionMetrics(pos);
      const openCapital = metrics.openShares * metrics.avgEntry; // cost basis of open lots
      if (pos.coreAllocation === 'satellite') {
        satelliteCapital += openCapital;
      } else {
        // Default to 'core' if not set
        coreCapital += openCapital;
      }
    });

    const totalInvestmentCapital = coreCapital + satelliteCapital;
    const corePercent = totalInvestmentCapital > 0 ? (coreCapital / totalInvestmentCapital) * 100 : 100;
    const satellitePercent = totalInvestmentCapital > 0 ? (satelliteCapital / totalInvestmentCapital) * 100 : 0;
    const isBalanced = satellitePercent <= (100 - coreSatelliteTarget + 5); // 5% tolerance

    return { coreCapital, satelliteCapital, corePercent, satellitePercent, totalInvestmentCapital, isBalanced };
  }, [positions, coreSatelliteTarget]);`;

const newCoreStats = `  // --- Core & Satellite Computed Stats ---
  const coreStats = useMemo(() => {
    // Only active investment positions with open shares
    const investmentPositions = positions.filter(p => p.portfolioType === 'investment' && p.status === 'active');
    
    let coreCapital = 0;
    let satelliteCapital = 0;

    investmentPositions.forEach(pos => {
      const metrics = computePositionMetrics(pos);
      const openShares = metrics.openShares;
      const avgEntry = metrics.avgEntry;

      if (openShares <= 0) return;

      // coreShares is user-defined; satellite = openShares - coreShares
      const coreShares = pos.coreShares !== undefined
        ? Math.min(pos.coreShares, openShares)  // can't designate more than open
        : openShares; // default: all shares are Core until user splits

      const satelliteShares = Math.max(0, openShares - coreShares);

      coreCapital += coreShares * avgEntry;
      satelliteCapital += satelliteShares * avgEntry;
    });

    const totalInvestmentCapital = coreCapital + satelliteCapital;
    const corePercent = totalInvestmentCapital > 0 ? (coreCapital / totalInvestmentCapital) * 100 : 100;
    const satellitePercent = totalInvestmentCapital > 0 ? (satelliteCapital / totalInvestmentCapital) * 100 : 0;
    const isBalanced = satellitePercent <= (100 - coreSatelliteTarget + 5); // 5% tolerance

    return { coreCapital, satelliteCapital, corePercent, satellitePercent, totalInvestmentCapital, isBalanced };
  }, [positions, coreSatelliteTarget]);`;

if (ctx.includes(oldCoreStats)) {
  ctx = ctx.replace(oldCoreStats, newCoreStats);
  console.log('✓ coreStats logic updated');
} else {
  console.log('OLD string not found — doing partial replace...');
  ctx = ctx.replace(/pos\.coreAllocation === 'satellite'[\s\S]*?coreCapital \+= openCapital;/,
    `const coreShares = pos.coreShares !== undefined ? Math.min(pos.coreShares, metrics.openShares) : metrics.openShares;\n      const satelliteShares = Math.max(0, metrics.openShares - coreShares);\n      coreCapital += coreShares * metrics.avgEntry;\n      satelliteCapital += satelliteShares * metrics.avgEntry;`
  );
  ctx = ctx.replace(/const openCapital = metrics\.openShares \* metrics\.avgEntry;[\s\S]*?coreCapital \+= openCapital;/,
    `const coreShares = pos.coreShares !== undefined ? Math.min(pos.coreShares, metrics.openShares) : metrics.openShares;\n      const satelliteShares = Math.max(0, metrics.openShares - coreShares);\n      coreCapital += coreShares * metrics.avgEntry;\n      satelliteCapital += satelliteShares * metrics.avgEntry;`
  );
  console.log('✓ partial replace done');
}

// 3. Fix normalizePosition to use coreShares instead of coreAllocation
ctx = ctx.replace(
  `      coreAllocation: raw.coreAllocation || undefined,`,
  `      coreShares: raw.coreShares !== undefined ? Number(raw.coreShares) : undefined,`
);

fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ TradeContext updated');
