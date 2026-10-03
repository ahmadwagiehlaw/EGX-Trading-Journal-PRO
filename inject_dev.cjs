const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// Insert behavioralDeviations before emotionStats
const emStatsIdx = code.indexOf('const emotionStats = useMemo(() => {');
const devLogic = `const behavioralDeviations = useMemo(() => {
    let costOfHope = 0;
    let costOfFear = 0;
    let disciplinedCount = 0;
    let totalAnalyzed = 0;

    positionsWithRealizedPnL.forEach(p => {
      const metrics = computePositionMetrics(p, commissionRate);
      const plan = p.plan;
      if (!plan || !metrics.isFullyClosed) return;
      
      totalAnalyzed++;
      let disciplined = true;

      // Extra loss from ignoring stop loss
      if (metrics.netRealizedPnL < 0 && plan.stop && plan.stop > 0) {
        if (metrics.avgExit < plan.stop) {
          disciplined = false;
          costOfHope += ((plan.stop - metrics.avgExit) * metrics.totalSold);
        }
      }
      
      // Early exit from winning trades
      if (metrics.netRealizedPnL > 0 && plan.target && plan.target > 0) {
        // We only consider it early exit if they missed out significantly (e.g. at least 1% below target)
        if (metrics.avgExit < (plan.target * 0.99)) {
          disciplined = false;
          costOfFear += ((plan.target - metrics.avgExit) * metrics.totalSold);
        }
      }
      
      if (disciplined) disciplinedCount++;
    });

    return {
      costOfHope,
      costOfFear,
      disciplinedCount,
      totalAnalyzed,
      disciplineRate: totalAnalyzed > 0 ? (disciplinedCount / totalAnalyzed) * 100 : 0
    };
  }, [positionsWithRealizedPnL, commissionRate]);\n\n  `;

code = code.slice(0, emStatsIdx) + devLogic + code.slice(emStatsIdx);

fs.writeFileSync('src/components/Analytics.tsx', code, 'utf8');
console.log('Injected behavioralDeviations');
