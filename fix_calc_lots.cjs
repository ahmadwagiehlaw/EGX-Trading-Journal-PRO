const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const logic = `
export interface OpenLot {
  id: string;
  date: number;
  price: number;
  originalShares: number;
  remainingShares: number;
}

export function computeOpenLotsLowestPriceFirst(transactions: Transaction[] = []): OpenLot[] {
  // Extract all buy transactions
  let buys = transactions
    .filter(t => t.type === 'buy')
    .map(t => ({
      id: t.id,
      date: t.date,
      price: t.price,
      originalShares: t.shares,
      remainingShares: t.shares
    }))
    .sort((a, b) => a.price - b.price); // Lowest price first!

  // Subtract sells
  const sells = transactions.filter(t => t.type === 'sell');
  for (const sell of sells) {
    let sharesToSell = sell.shares;
    for (const buy of buys) {
      if (sharesToSell <= 0) break;
      if (buy.remainingShares > 0) {
        const deducted = Math.min(buy.remainingShares, sharesToSell);
        buy.remainingShares -= deducted;
        sharesToSell -= deducted;
      }
    }
  }

  // Return only remaining lots, sorted by date (or keep lowest price first?)
  // Let's sort by price ascending so the user sees the cheapest first to sell.
  return buys.filter(b => b.remainingShares > 0).sort((a, b) => a.price - b.price);
}
`;

if (!code.includes('computeOpenLotsLowestPriceFirst')) {
    code = code + '\n' + logic;
    fs.writeFileSync('src/utils/calculations.ts', code, 'utf8');
    console.log("Added computeOpenLotsLowestPriceFirst");
}
