const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const missingFuncs = `
export function computeDominantPortfolio(transactions: Transaction[], defaultPortfolio: 'investment' | 'speculation' = 'investment'): 'investment' | 'speculation' {
  if (!transactions || transactions.length === 0) return defaultPortfolio;
  let invShares = 0;
  let specShares = 0;
  
  transactions.filter(t => t.type === 'buy').forEach(t => {
    const pType = t.portfolioType || defaultPortfolio;
    if (pType === 'investment') invShares += t.shares;
    else specShares += t.shares;
  });
  
  return invShares >= specShares ? 'investment' : 'speculation';
}

export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], defaultPortfolio: 'investment' | 'speculation' = 'investment') {
  let investmentCapital = 0;
  let speculationCapital = 0;

  transactions.filter(t => t.type === 'buy').forEach(buy => {
    const pType = buy.portfolioType || defaultPortfolio;
    // Calculate how many shares are still open for this specific buy
    const linkedSells = transactions.filter(t => t.type === 'sell' && t.linkedBuyId === buy.id);
    const closedShares = linkedSells.reduce((sum, t) => sum + t.shares, 0);
    const openSharesForBuy = Math.max(0, buy.shares - closedShares);
    
    if (pType === 'investment') {
      investmentCapital += openSharesForBuy * (buy.amount / buy.shares);
    } else {
      speculationCapital += openSharesForBuy * (buy.amount / buy.shares);
    }
  });

  return { investment: investmentCapital, speculation: speculationCapital, total: investmentCapital + speculationCapital };
}

export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], defaultPortfolio: 'investment' | 'speculation' = 'investment') {
  let investmentPnL = 0;
  let speculationPnL = 0;

  const sellTxs = transactions.filter(t => t.type === 'sell');
  if (sellTxs.length === 0) return { investment: 0, speculation: 0, total: 0 };

  sellTxs.forEach(sell => {
    if (sell.linkedBuyId) {
      const buy = transactions.find(t => t.id === sell.linkedBuyId);
      if (buy) {
        const pType = buy.portfolioType || defaultPortfolio;
        const buyPrice = buy.amount / buy.shares;
        const sellPrice = sell.amount / sell.shares;
        const pnl = (sellPrice - buyPrice) * sell.shares;
        
        if (pType === 'investment') investmentPnL += pnl;
        else speculationPnL += pnl;
      }
    }
  });

  return { investment: investmentPnL, speculation: speculationPnL, total: investmentPnL + speculationPnL };
}
`;

c += missingFuncs;

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Added missing functions');
