const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const computeOpenInvestedOld = /export function computeOpenInvestedCapitalByPortfolio[\s\S]*?total: investmentCapital \+ speculationCapital \};\n\}/;

const computeOpenInvestedNew = `export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], defaultPortfolio: 'investment' | 'speculation' = 'investment', commissionRate: number = 0.003) {
  // Using accurate FIFO simulation to get total cost of CURRENTLY OPEN shares
  const sim = simulatePositionMetrics(transactions, commissionRate);
  
  // For simplicity, we allocate all open cost to the dominant or default portfolio of the position
  const dominant = computeDominantPortfolio(transactions, defaultPortfolio);
  
  if (dominant === 'investment') {
    return { investment: sim.totalCost, speculation: 0, total: sim.totalCost };
  } else {
    return { investment: 0, speculation: sim.totalCost, total: sim.totalCost };
  }
}`;

c = c.replace(computeOpenInvestedOld, computeOpenInvestedNew);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed computeOpenInvestedCapitalByPortfolio');
