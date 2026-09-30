const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const computeRealizedPnLOld = /export function computeRealizedPnL\([\s\S]*?\n\}/;
const computeTotalCommissionOld = /export function computeTotalCommission\([\s\S]*?\n\}/;
const computeNetRealizedPnLOld = /export function computeNetRealizedPnL\([\s\S]*?\n\}/;

const computeNetRealizedPnLNew = `export function computeTotalCommission(transactions: Transaction[] = [], rate: number = 0.003): number {
  return transactions.reduce((sum, tx) => sum + (tx.amount * rate), 0);
}

export function computeRealizedPnL(transactions: Transaction[] = []): number {
  const avgEntry = computeWeightedAvgEntry(transactions);
  const sellTxs = transactions.filter(t => t.type === 'sell');
  
  if (sellTxs.length === 0 || avgEntry === 0) return 0;
  
  return sellTxs.reduce((pnl, sell) => {
    return pnl + ((sell.price - avgEntry) * sell.shares);
  }, 0);
}

export function computeNetRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  const avgEntry = computeWeightedAvgEntry(transactions);
  const sellTxs = transactions.filter(t => t.type === 'sell');
  
  if (sellTxs.length === 0 || avgEntry === 0) return 0;
  
  return sellTxs.reduce((pnl, sell) => {
    // Gross PnL for this sell
    const gross = (sell.price - avgEntry) * sell.shares;
    
    // Commission for this sell
    const sellComm = sell.amount * commissionRate;
    
    // Proportional Commission for the original buy of these shares
    // (We estimate the buy cost as avgEntry * sell.shares)
    const buyComm = (avgEntry * sell.shares) * commissionRate;
    
    return pnl + (gross - sellComm - buyComm);
  }, 0);
}`;

// I'll just replace computeNetRealizedPnL to do the right thing inline!
c = c.replace(computeNetRealizedPnLOld, `export function computeNetRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  const avgEntry = computeWeightedAvgEntry(transactions);
  const sellTxs = transactions.filter(t => t.type === 'sell');
  if (sellTxs.length === 0 || avgEntry === 0) return 0;
  return sellTxs.reduce((pnl, sell) => {
    const gross = (sell.price - avgEntry) * sell.shares;
    const sellComm = sell.amount * commissionRate;
    const buyComm = (avgEntry * sell.shares) * commissionRate;
    return pnl + (gross - sellComm - buyComm);
  }, 0);
}`);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed computeNetRealizedPnL');
