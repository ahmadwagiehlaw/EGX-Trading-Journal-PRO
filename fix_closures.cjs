const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/metrics\.isOpen/g, 'metrics!.isOpen');
c = c.replace(/metrics\.avgEntry/g, 'metrics!.avgEntry');
c = c.replace(/metrics\.currentPrice/g, 'metrics!.currentPrice');
c = c.replace(/metrics\.currentStop/g, 'metrics!.currentStop');
c = c.replace(/metrics\.openShares/g, 'metrics!.openShares');
c = c.replace(/metrics\.realizedPnL/g, 'metrics!.realizedPnL');
c = c.replace(/metrics\.txPnL/g, 'metrics!.txPnL');
c = c.replace(/metrics\.netUnrealizedPnL/g, 'metrics!.netUnrealizedPnL');
c = c.replace(/metrics\.netRealizedPnL/g, 'metrics!.netRealizedPnL');
c = c.replace(/metrics\.totalSold/g, 'metrics!.totalSold');
c = c.replace(/metrics\.unrealizedPnL/g, 'metrics!.unrealizedPnL');
c = c.replace(/metrics\.totalProfit/g, 'metrics!.totalProfit');
c = c.replace(/metrics\?/g, 'metrics!');

c = c.replace(/position\.symbol/g, 'position!.symbol');
c = c.replace(/position\.plan/g, 'position!.plan');
c = c.replace(/position\.trailingStop/g, 'position!.trailingStop');
c = c.replace(/position\.transactions/g, 'position!.transactions');
c = c.replace(/position\.id/g, 'position!.id');

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed closures');
