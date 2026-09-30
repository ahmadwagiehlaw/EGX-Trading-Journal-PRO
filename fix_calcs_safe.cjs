const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

// Replace simulatePositionMetrics
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


// Replace computeRealizedPnL
c = c.replace(
  /export function computeRealizedPnL\(transactions: Transaction\[\] = \[\]\): number \{\n  return simulatePositionMetrics\(transactions\)\.totalRealizedPnL;\n\}/g,
  `export function computeRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  return simulatePositionMetrics(transactions, commissionRate).totalRealizedPnL;
}`
);

// Replace computeTotalCommission
c = c.replace(
  /export function computeTotalCommission\(transactions: Transaction\[\] = \[\], rate: number = 0\.003\): number \{\n  return transactions\.reduce\(\(sum, tx\) => sum \+ \(tx\.amount \* rate\), 0\);\n\}/g,
  `export function computeTotalCommission(transactions: Transaction[] = [], rate: number = 0.003): number {
  return simulatePositionMetrics(transactions, rate).totalCommissionPaid;
}`
);

// Replace computeNetRealizedPnL
c = c.replace(
  /export function computeNetRealizedPnL\(transactions: Transaction\[\] = \[\], commissionRate: number = 0\.003\): number \{\n  const grossPnL = computeRealizedPnL\(transactions\);\n  const totalFees = computeTotalCommission\(transactions, commissionRate\);\n  return grossPnL - totalFees;\n\}/g,
  `export function computeNetRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  return simulatePositionMetrics(transactions, commissionRate).totalNetRealizedPnL;
}`
);

// Replace computePositionMetrics body safely
const posMetricsBodyOld = `  const avgEntry = computeWeightedAvgEntry(transactions);
  const avgExit = computeWeightedAvgExit(transactions);
  const totalBought = computeTotalBoughtShares(transactions);
  const totalSold = computeTotalSoldShares(transactions);
  const openShares = computeOpenShares(transactions);
  const realizedPnL = computeRealizedPnL(transactions);
  const totalCommission = computeTotalCommission(transactions, commissionRate);
  const netRealizedPnL = computeNetRealizedPnL(transactions, commissionRate);
  const openInvested = computeOpenInvestedCapital(transactions);`;

const posMetricsBodyNew = `  const sim = simulatePositionMetrics(transactions, commissionRate);
  const avgEntry = sim.avgEntry;
  const avgExit = sim.avgExit;
  const totalBought = sim.totalBought;
  const totalSold = sim.totalSold;
  const openShares = sim.openShares;
  const realizedPnL = sim.totalRealizedPnL;
  const netRealizedPnL = sim.totalNetRealizedPnL;
  const totalCommission = sim.totalCommissionPaid;
  const openInvested = sim.openShares * sim.avgEntry;`;

c = c.replace(posMetricsBodyOld, posMetricsBodyNew);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed computations');
