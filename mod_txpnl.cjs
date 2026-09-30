const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const newSimFunc = `
export function simulatePositionMetrics(transactions: Transaction[] = [], commissionRate: number = 0.003) {
  const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);
  
  let openLots: { shares: number; price: number; amount: number; txId: string; date: number; }[] = [];
  
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
      openLots.push({
        shares: tx.shares,
        price: tx.price,
        amount: tx.amount,
        txId: tx.id,
        date: tx.date
      });
      totalBought += tx.shares;
    } else if (tx.type === 'sell') {
      let sharesToSell = tx.shares;
      const netProceeds = tx.amount - txCommission;
      const netPricePerShare = netProceeds / tx.shares;
      const grossPricePerShare = tx.price;
      
      // Sort open lots by lowest price first (as requested: "حسب اقل سعر دخول ثم اللي بعده")
      openLots.sort((a, b) => a.price - b.price);

      let txRealizedPnL = 0;
      let txNetRealizedPnL = 0;

      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const sharesFromLot = Math.min(sharesToSell, lot.shares);
        
        // Calculate cost of these specific shares
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
        lot.amount = lot.shares * lotCostPerShare; // Update amount for remaining shares
        
        if (lot.shares <= 0) {
          openLots.shift();
        }
      }
      
      totalRealizedPnL += txRealizedPnL;
      totalNetRealizedPnL += txNetRealizedPnL;
      if (tx.id) {
        txPnL[tx.id] = txNetRealizedPnL;
      }
      
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
      if (tx.id) {
        txPnL[tx.id] = tx.amount;
      }
    }
  }

  const currentShares = openLots.reduce((sum, lot) => sum + lot.shares, 0);
  const totalCost = openLots.reduce((sum, lot) => sum + lot.amount + (lot.amount * commissionRate), 0);
  
  const avgEntry = currentShares > 0 ? openLots.reduce((sum, lot) => sum + lot.amount, 0) / currentShares : 0;
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
    totalCommissionPaid,
    txPnL
  };
}
`;

c = c.replace(/export function simulatePositionMetrics\([\s\S]*?totalCommissionPaid\n  \};\n\}/, newSimFunc);

// Update computePositionMetrics to pass txPnL out
c = c.replace(/totalCommissionPaid: sim\.totalCommissionPaid\n  \};/g, "totalCommissionPaid: sim.totalCommissionPaid,\n    txPnL: sim.txPnL\n  };");
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Added txPnL to simulatePositionMetrics');
