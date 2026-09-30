const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');
c += `
/**
 * Format currency in Egyptian Pounds (EGP).
 */
export function formatEGP(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Determine the dominant portfolio for a position based on its transactions.
 */
export function computeDominantPortfolio(transactions: Transaction[] = []): 'investment' | 'speculation' {
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

export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = []): { investment: number, speculation: number } {
  const sorted = [...transactions].sort((a, b) => a.date - b.date);
  let openLots: { shares: number; price: number; amount: number; pType: 'investment' | 'speculation' }[] = [];
  
  for (const tx of sorted) {
    if (tx.type === 'buy') {
      openLots.push({ shares: tx.shares, price: tx.price, amount: tx.amount, pType: tx.portfolioType || 'investment' });
    } else if (tx.type === 'sell') {
      let sharesToSell = tx.shares;
      openLots.sort((a, b) => a.price - b.price); // match how simulatePositionMetrics works
      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const sharesFromLot = Math.min(sharesToSell, lot.shares);
        sharesToSell -= sharesFromLot;
        lot.shares -= sharesFromLot;
        lot.amount = lot.shares * (lot.amount / (lot.shares + sharesFromLot)); // Update amount based on avg cost
        if (lot.shares <= 0) {
          openLots.shift();
        }
      }
    } else if (tx.type === 'split' || tx.type === 'bonus') {
      const multiplier = tx.price > 0 ? tx.price : 1;
      for (const lot of openLots) {
        lot.shares *= multiplier;
        lot.price /= multiplier;
      }
    }
  }
  
  let investment = 0;
  let speculation = 0;
  for (const lot of openLots) {
    if (lot.pType === 'investment') investment += lot.amount;
    else speculation += lot.amount;
  }
  return { investment, speculation };
}

export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], commissionRate: number = 0.003): { investment: number, speculation: number } {
  const sorted = [...transactions].sort((a, b) => a.date - b.date);
  let openLots: { shares: number; price: number; amount: number; pType: 'investment' | 'speculation' }[] = [];
  let investment = 0;
  let speculation = 0;
  
  for (const tx of sorted) {
    const txCommission = tx.amount * commissionRate;
    if (tx.type === 'buy') {
      openLots.push({ shares: tx.shares, price: tx.price, amount: tx.amount, pType: tx.portfolioType || 'investment' });
    } else if (tx.type === 'sell') {
      let sharesToSell = tx.shares;
      const netProceeds = tx.amount - txCommission;
      const netPricePerShare = netProceeds / tx.shares;
      
      openLots.sort((a, b) => a.price - b.price); // match Lowest Price First
      
      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const sharesFromLot = Math.min(sharesToSell, lot.shares);
        const lotCostPerShare = lot.amount / lot.shares;
        const lotCommissionPerShare = (lot.amount * commissionRate) / lot.shares;
        const totalCostPerShare = lotCostPerShare + lotCommissionPerShare;
        
        const netProceedsFromLot = sharesFromLot * netPricePerShare;
        const totalCostOfSharesFromLot = sharesFromLot * totalCostPerShare;
        const pnl = netProceedsFromLot - totalCostOfSharesFromLot;
        
        if (lot.pType === 'investment') investment += pnl;
        else speculation += pnl;
        
        sharesToSell -= sharesFromLot;
        lot.shares -= sharesFromLot;
        lot.amount = lot.shares * lotCostPerShare;
        if (lot.shares <= 0) {
          openLots.shift();
        }
      }
    } else if (tx.type === 'dividend') {
      // For dividends, we can attribute to dominant portfolio
      const dom = computeDominantPortfolio(openLots as any);
      if (dom === 'investment') investment += tx.amount;
      else speculation += tx.amount;
    }
  }
  
  return { investment, speculation };
}
`;
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Restored missing functions');
