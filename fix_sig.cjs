const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/export function computeOpenInvestedCapitalByPortfolio\(transactions: Transaction\[\] = \[\], commissionRate: number = 0\.003\)/, "export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], pType?: string, commissionRate: number = 0.003)");

c = c.replace(/export function computeRealizedPnLByPortfolio\(transactions: Transaction\[\] = \[\], commissionRate: number = 0\.003\)/, "export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], pType?: string, commissionRate: number = 0.003)");

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed signature');
