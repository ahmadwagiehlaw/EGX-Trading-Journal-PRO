const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/const openSplit = computeOpenInvestedCapitalByPortfolio\(pos\.transactions, pos\.portfolioType\);/g, 'const openSplit = computeOpenInvestedCapitalByPortfolio(pos.transactions, pos.portfolioType, commissionRate);');

c = c.replace(/const pnlSplit = computeRealizedPnLByPortfolio\(pos\.transactions \|\| \[\], pos\.portfolioType\);/g, 'const pnlSplit = computeRealizedPnLByPortfolio(pos.transactions || [], pos.portfolioType, commissionRate);');

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('Fixed TradeContext calls');
