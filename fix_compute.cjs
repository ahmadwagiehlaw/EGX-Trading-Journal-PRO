const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/export function computeRealizedPnL[\s\S]*?simulatePositionMetrics\(transactions\)\.totalRealizedPnL;\n\}/g, `export function computeRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  return simulatePositionMetrics(transactions, commissionRate).totalRealizedPnL;
}`);

c = c.replace(/export function computeTotalCommission[\s\S]*?transactions\.reduce\(\(sum, tx\) => sum \+ \(tx\.amount \* rate\), 0\);\n\}/g, `export function computeTotalCommission(transactions: Transaction[] = [], rate: number = 0.003): number {
  return simulatePositionMetrics(transactions, rate).totalCommissionPaid;
}`);

c = c.replace(/export function computeNetRealizedPnL[\s\S]*?return grossPnL - totalFees;\n\}/g, `export function computeNetRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  return simulatePositionMetrics(transactions, commissionRate).totalNetRealizedPnL;
}`);

c = c.replace(/const avgEntry = computeWeightedAvgEntry\(transactions\);[\s\S]*?const openInvested = computeOpenInvestedCapital\(transactions\);/g, `const sim = simulatePositionMetrics(transactions, commissionRate);
  const avgEntry = sim.avgEntry;
  const avgExit = sim.avgExit;
  const totalBought = sim.totalBought;
  const totalSold = sim.totalSold;
  const openShares = sim.openShares;
  const realizedPnL = sim.totalRealizedPnL;
  const netRealizedPnL = sim.totalNetRealizedPnL;
  const totalCommission = sim.totalCommissionPaid;
  const openInvested = sim.openShares * sim.avgEntry;`);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed compute functions');
