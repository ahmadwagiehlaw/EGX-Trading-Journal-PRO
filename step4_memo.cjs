const fs = require('fs');
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 4. Add coreStats useMemo — insert before `const { depositedInvestment ...`
const insertBefore = `  const { depositedInvestment, depositedSpeculation, capitalInvestment, capitalSpeculation } = useMemo(() => {`;

const coreStatsMemo = `  // --- Core & Satellite Computed Stats ---
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
  }, [positions, coreSatelliteTarget]);

`;

ctx = ctx.replace(insertBefore, coreStatsMemo + insertBefore);
fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ coreStats useMemo added');
