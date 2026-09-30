const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const newCompute = `export function computePositionMetrics(position: TickerPosition, commissionRate: number = 0.003) {
  const transactions = position.transactions || [];
  const sim = simulatePositionMetrics(transactions, commissionRate);
  
  const currentStop = position.trailingStop?.current || position.plan?.stop || 0;
  const openRisk = computeOpenRisk(currentStop, sim.avgEntry, sim.openShares);
  const isOpen = sim.openShares > 0 && position.status !== 'closed';
  
  const currentPrice = position.currentMarketPrice || sim.avgEntry;
  const unrealizedPnL = currentPrice > 0 && sim.openShares > 0 ? (currentPrice - sim.avgEntry) * sim.openShares : 0;
  const netUnrealizedPnL = currentPrice > 0 && sim.openShares > 0 ? ((currentPrice - sim.avgEntry) * sim.openShares) - (currentPrice * sim.openShares * commissionRate) : 0;

  return {
    avgEntry: sim.avgEntry,
    avgExit: sim.avgExit,
    totalBought: sim.totalBought,
    totalSold: sim.totalSold,
    openShares: sim.openShares,
    realizedPnL: sim.totalRealizedPnL,
    totalCommission: sim.totalCommissionPaid,
    netRealizedPnL: sim.totalNetRealizedPnL,
    openInvested: sim.totalCost,
    currentStop,
    openRisk,
    isOpen,
    isFullyClosed: !isOpen && sim.totalSold > 0,
    currentPrice,
    unrealizedPnL,
    netUnrealizedPnL,
    txPnL: sim.txPnL || {}
  };
}`;

c = c.replace(/export function computePositionMetrics\([\s\S]*?netUnrealizedPnL:[\s\S]*?\},?\s*\}/, newCompute);

// Make sure txPnL type is right.
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed computePositionMetrics');
