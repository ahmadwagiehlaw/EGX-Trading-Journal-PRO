const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// Fix useTrades to include activeDeposited and portfolioFilter
c = c.replace(
  `const { 
          positions, 
      filteredPositions,
      activeCapital,
      activeOpenCapital,
      activeOpenRisk,
      openPositionsCount,
      commissionRate,
      profitFactor,
      maxDrawdown
    } = useTrades();`,
  `const { 
      positions,
      filteredPositions,
      activeCapital,
      activeDeposited,
      activeOpenCapital,
      activeOpenRisk,
      openPositionsCount,
      commissionRate,
      profitFactor,
      maxDrawdown,
      portfolioFilter,
    } = useTrades();`
);

// Fix positionsWithRealizedPnL to also include partial sells
c = c.replace(
  `return filteredPositions.filter(pos => {
        const metrics = computePositionMetrics(pos, commissionRate);
        return pos.status === 'closed' || metrics.isFullyClosed;
      });
    }, [positions, commissionRate]);`,
  `return filteredPositions.filter(pos => {
        const metrics = computePositionMetrics(pos, commissionRate);
        return pos.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0;
      });
    }, [filteredPositions, commissionRate]);`
);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed Analytics useTrades');
