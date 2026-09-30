const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const computeRealizedPnLOld = /export function computeRealizedPnLByPortfolio[\s\S]*?total: investmentPnL \+ speculationPnL \};\n\}/;

const computeRealizedPnLNew = `export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], defaultPortfolio: 'investment' | 'speculation' = 'investment', commissionRate: number = 0.003) {
  const sim = simulatePositionMetrics(transactions, commissionRate);
  const dominant = computeDominantPortfolio(transactions, defaultPortfolio);
  
  if (dominant === 'investment') {
    return { investment: sim.totalNetRealizedPnL, speculation: 0, total: sim.totalNetRealizedPnL };
  } else {
    return { investment: 0, speculation: sim.totalNetRealizedPnL, total: sim.totalNetRealizedPnL };
  }
}`;

c = c.replace(computeRealizedPnLOld, computeRealizedPnLNew);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed computeRealizedPnLByPortfolio');
