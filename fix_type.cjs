const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/defaultType=\{.*?txModalType \?.*?txModalType \|\| 'buy'.*?\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell') || 'buy'}");
// or just replace the whole tag
c = c.replace(/defaultType=\{txModalType === 'sellAll' \? 'sell' : txModalType \|\| 'buy'\}/g, "defaultType={txModalType === 'sellAll' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}");

c = c.replace(/defaultType=\{txModalType === 'sellAll' \|\| txModalType === 'edit' \? 'sell' : txModalType \|\| 'buy'\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}");

c = c.replace(/defaultType=\{txModalType === 'sellAll' \|\| txModalType === 'edit' \? 'sell' : \(txModalType \|\| 'buy'\)\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}");


fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
