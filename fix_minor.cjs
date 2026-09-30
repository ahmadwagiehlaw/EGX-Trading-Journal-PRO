const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/emotion\?: string;/g, "emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';");

// remove unused pType
c = c.replace(/export function computeOpenInvestedCapitalByPortfolio\(transactions: Transaction\[\] = \[\], pType\?: string, commissionRate: number = 0\.003\)/, "export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], _pType?: string, commissionRate: number = 0.003)");
c = c.replace(/export function computeRealizedPnLByPortfolio\(transactions: Transaction\[\] = \[\], pType\?: string, commissionRate: number = 0\.003\)/, "export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], _pType?: string, commissionRate: number = 0.003)");

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');

let tc = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
tc = tc.replace(/entryZone: pos\.plan\.entryZone,/g, "entryZone: pos.plan?.entryZone || { min: 0, max: 0 },");
fs.writeFileSync('src/context/TradeContext.tsx', tc, 'utf8');

console.log('Fixed minor TS errors');
