const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const simulateOld = /export function simulatePositionMetrics\(transactions: Transaction\[\] = \[\]\) \{[\s\S]*?return \{\s*openShares: currentShares,[\s\S]*?totalDividends\s*\};\s*\}/;

const simulateNew = `export function simulatePositionMetrics(transactions: Transaction[] = [], commissionRate: number = 0.003) {
  const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);
  
  let currentShares = 0;
  let totalCost = 0; // Total cost basis of CURRENT open shares INCLUDING commission
  let totalRealizedPnL = 0;
  let totalNetRealizedPnL = 0;
  let totalDividends = 0;
  let totalBought = 0;
  let totalSold = 0;
  let totalRevenue = 0;
  let totalCommissionPaid = 0; // Only track commission for all txs if needed

  for (const tx of sortedTxs) {
    const txCommission = tx.amount * commissionRate;
    totalCommissionPaid += txCommission;

    if (tx.type === 'buy') {
      currentShares += tx.shares;
      totalCost += (tx.amount + txCommission); // Add cost of shares + broker fees
      totalBought += tx.shares;
    } else if (tx.type === 'sell') {
      if (currentShares > 0) {
        const avgCost = totalCost / currentShares; // Cost per share (includes buy commission)
        const cogs = avgCost * tx.shares; // Cost of goods sold
        totalCost -= cogs;
        
        const netProceeds = tx.amount - txCommission; // Money received after sell broker fees
        const grossProceeds = tx.amount;

        // Gross PnL (ignoring commissions for pure metric tracking)
        // We estimate pure cost basis for Gross PnL
        const pureAvgCost = (totalCost - (totalCost * commissionRate)) / currentShares; // rough estimate
        
        totalRealizedPnL += (grossProceeds - (avgCost * tx.shares)); // Legacy gross tracking
        totalNetRealizedPnL += (netProceeds - cogs); // True net profit
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
      totalNetRealizedPnL += tx.amount; // Dividends have no broker commission in this model usually
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
}`;

c = c.replace(simulateOld, simulateNew);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed simulatePositionMetrics');
