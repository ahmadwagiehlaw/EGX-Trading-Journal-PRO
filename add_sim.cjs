const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const simFunc = `
export function simulatePositionMetrics(transactions: Transaction[] = [], commissionRate: number = 0.003) {
  const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);
  
  let currentShares = 0;
  let totalCost = 0;
  let totalRealizedPnL = 0;
  let totalNetRealizedPnL = 0;
  let totalDividends = 0;
  let totalBought = 0;
  let totalSold = 0;
  let totalRevenue = 0;
  let totalCommissionPaid = 0;

  for (const tx of sortedTxs) {
    const txCommission = tx.amount * commissionRate;
    totalCommissionPaid += txCommission;

    if (tx.type === 'buy') {
      currentShares += tx.shares;
      totalCost += (tx.amount + txCommission);
      totalBought += tx.shares;
    } else if (tx.type === 'sell') {
      if (currentShares > 0) {
        const avgCost = totalCost / currentShares;
        const cogs = avgCost * tx.shares;
        totalCost -= cogs;
        
        const netProceeds = tx.amount - txCommission;
        const grossProceeds = tx.amount;
        
        totalRealizedPnL += (grossProceeds - (avgCost * tx.shares));
        totalNetRealizedPnL += (netProceeds - cogs);
      }
      currentShares = Math.max(0, currentShares - tx.shares);
      totalSold += tx.shares;
      totalRevenue += tx.amount;
    } else if (tx.type === 'split' || tx.type === 'bonus') {
      const multiplier = tx.price > 0 ? tx.price : 1;
      currentShares = currentShares * multiplier;
      totalBought = totalBought * multiplier;
      totalSold = totalSold * multiplier;
    } else if (tx.type === 'dividend') {
      totalDividends += tx.amount;
      totalRealizedPnL += tx.amount;
      totalNetRealizedPnL += tx.amount;
    }
  }

  const avgEntry = currentShares > 0 ? totalCost / currentShares : 0;
  const avgExit = totalSold > 0 ? totalRevenue / totalSold : 0;

  return {
    openShares: currentShares,
    avgEntry,
    avgExit,
    totalBought,
    totalSold,
    totalCost,
    totalRealizedPnL,
    totalNetRealizedPnL,
    totalDividends,
    totalCommissionPaid
  };
}
`;

c += simFunc;

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Added simulatePositionMetrics back');
