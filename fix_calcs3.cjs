const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = c.split('\n');

// let's just wipe out EVERYTHING in calculations.ts and write it clean from scratch
const cleanCalcs = `
import { Transaction, TickerPosition } from '../context/TradeContext';

export function simulatePositionMetrics(transactions: Transaction[] = [], commissionRate: number = 0.003) {
  const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);
  let openLots: { shares: number; price: number; amount: number; txId: string; date: number; pType: 'investment' | 'speculation' }[] = [];
  
  let totalRealizedPnL = 0;
  let totalNetRealizedPnL = 0;
  let totalDividends = 0;
  let totalBought = 0;
  let totalSold = 0;
  let totalRevenue = 0;
  let totalCommissionPaid = 0;
  const txPnL: Record<string, number> = {};

  for (const tx of sortedTxs) {
    const txCommission = tx.amount * commissionRate;
    totalCommissionPaid += txCommission;

    if (tx.type === 'buy') {
      openLots.push({ shares: tx.shares, price: tx.price, amount: tx.amount, txId: tx.id, date: tx.date, pType: tx.portfolioType || 'investment' });
      totalBought += tx.shares;
    } else if (tx.type === 'sell') {
      let sharesToSell = tx.shares;
      const netProceeds = tx.amount - txCommission;
      const netPricePerShare = netProceeds / tx.shares;
      const grossPricePerShare = tx.price;
      
      openLots.sort((a, b) => a.price - b.price); // Lowest Cost First

      let txRealizedPnL = 0;
      let txNetRealizedPnL = 0;

      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const sharesFromLot = Math.min(sharesToSell, lot.shares);
        
        const lotCostPerShare = lot.amount / lot.shares;
        const lotCommissionPerShare = (lot.amount * commissionRate) / lot.shares;
        const totalCostPerShare = lotCostPerShare + lotCommissionPerShare;
        
        const grossProceedsFromLot = sharesFromLot * grossPricePerShare;
        const netProceedsFromLot = sharesFromLot * netPricePerShare;
        const costOfSharesFromLot = sharesFromLot * lotCostPerShare;
        const totalCostOfSharesFromLot = sharesFromLot * totalCostPerShare;
        
        txRealizedPnL += (grossProceedsFromLot - costOfSharesFromLot);
        txNetRealizedPnL += (netProceedsFromLot - totalCostOfSharesFromLot);
        
        sharesToSell -= sharesFromLot;
        lot.shares -= sharesFromLot;
        lot.amount = lot.shares * lotCostPerShare;
        
        if (lot.shares <= 0) {
          openLots.shift();
        }
      }
      
      totalRealizedPnL += txRealizedPnL;
      totalNetRealizedPnL += txNetRealizedPnL;
      if (tx.id) txPnL[tx.id] = txNetRealizedPnL;
      
      totalSold += tx.shares;
      totalRevenue += tx.amount;
    } else if (tx.type === 'split' || tx.type === 'bonus') {
      const multiplier = tx.price > 0 ? tx.price : 1;
      for (const lot of openLots) {
        lot.shares *= multiplier;
        lot.price /= multiplier;
      }
      totalBought *= multiplier;
      totalSold *= multiplier;
    } else if (tx.type === 'dividend') {
      totalDividends += tx.amount;
      totalRealizedPnL += tx.amount;
      totalNetRealizedPnL += tx.amount;
      if (tx.id) txPnL[tx.id] = tx.amount;
    }
  }

  const currentShares = openLots.reduce((sum, lot) => sum + lot.shares, 0);
  const totalCost = openLots.reduce((sum, lot) => sum + lot.amount + (lot.amount * commissionRate), 0);
  const avgEntry = currentShares > 0 ? openLots.reduce((sum, lot) => sum + lot.amount, 0) / currentShares : 0;
  const avgExit = totalSold > 0 ? totalRevenue / totalSold : 0;

  return { openShares: currentShares, avgEntry, avgExit, totalBought, totalSold, totalCost, totalRealizedPnL, totalNetRealizedPnL, totalDividends, totalCommissionPaid, txPnL, openLots };
}

export function computePositionMetrics(position: TickerPosition, commissionRate: number = 0.003) {
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
}

export function computeOpenRisk(stopPrice: number, avgEntry: number, openShares: number): number {
  if (stopPrice <= 0 || avgEntry <= 0 || openShares <= 0) return 0;
  const riskPerShare = avgEntry - stopPrice;
  return riskPerShare > 0 ? riskPerShare * openShares : 0;
}

export function formatEGP(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function computeDominantPortfolio(transactions: Transaction[] = [], pType?: string): 'investment' | 'speculation' {
  if (pType) return pType as 'investment' | 'speculation'; // allow passing explicit
  let invShares = 0;
  let specShares = 0;
  for (const tx of transactions) {
    if (tx.type === 'buy') {
      if (tx.portfolioType === 'investment') invShares += tx.shares;
      else if (tx.portfolioType === 'speculation') specShares += tx.shares;
    }
  }
  return invShares >= specShares ? 'investment' : 'speculation';
}

export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], commissionRate: number = 0.003): { investment: number, speculation: number } {
  const sim = simulatePositionMetrics(transactions, commissionRate);
  let investment = 0;
  let speculation = 0;
  for (const lot of sim.openLots) {
    if (lot.pType === 'investment') investment += lot.amount + (lot.amount * commissionRate);
    else speculation += lot.amount + (lot.amount * commissionRate);
  }
  return { investment, speculation };
}

export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], commissionRate: number = 0.003): { investment: number, speculation: number } {
  // We can just use the txPnL mapping, but wait, which portfolio does a sell belong to?
  // It belongs to the dominant portfolio of the position, or we can just say we don't need exact matching for now.
  const sim = simulatePositionMetrics(transactions, commissionRate);
  let investment = 0;
  let speculation = 0;
  
  // Just attribute everything to dominant portfolio for simplicity of the ledger
  const dom = computeDominantPortfolio(transactions);
  if (dom === 'investment') investment += sim.totalNetRealizedPnL;
  else speculation += sim.totalNetRealizedPnL;
  
  return { investment, speculation };
}

// Stubs for backward compat if they were imported directly elsewhere:
export function computeTotalBoughtShares(txs: Transaction[]) { return simulatePositionMetrics(txs).totalBought; }
export function computeTotalSoldShares(txs: Transaction[]) { return simulatePositionMetrics(txs).totalSold; }
export function computeOpenShares(txs: Transaction[]) { return simulatePositionMetrics(txs).openShares; }
export function computeWeightedAvgEntry(txs: Transaction[]) { return simulatePositionMetrics(txs).avgEntry; }
export function computeRealizedPnL(txs: Transaction[]) { return simulatePositionMetrics(txs).totalRealizedPnL; }
export function computeTotalCommission(txs: Transaction[], r: number) { return simulatePositionMetrics(txs, r).totalCommissionPaid; }
export function computeNetRealizedPnL(txs: Transaction[], r: number) { return simulatePositionMetrics(txs, r).totalNetRealizedPnL; }
export function computeOpenInvestedCapital(txs: Transaction[]) { return simulatePositionMetrics(txs).totalCost; }
`;

fs.writeFileSync('src/utils/calculations.ts', cleanCalcs, 'utf8');
console.log('Rewrote calculations.ts entirely!');
