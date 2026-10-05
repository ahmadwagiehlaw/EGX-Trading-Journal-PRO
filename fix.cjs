const fs = require('fs');

// TradeContext.tsx
let content = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const oldBlock = "        if (pos.status === 'closed' || metrics.isFullyClosed) {\n          closedCount++;\n          sumPnL += metrics.realizedPnL;\n          sumNetPnL += metrics.netRealizedPnL;\n          \n          // Decide win/loss based on Net PnL is more accurate\n          if (metrics.netRealizedPnL > 0) wonCount++;\n          else if (metrics.netRealizedPnL < 0) lostCount++;\n          \n          if (pos.journal?.isRuleBreaker) ruleBreakerCount++;\n        } else if (metrics.realizedPnL !== 0) {\n          // If partially closed, add its realized PnL too!\n          sumPnL += metrics.realizedPnL;\n          sumNetPnL += metrics.netRealizedPnL;\n        }";
const newBlock = "        if (metrics.realizedPnL !== 0) {\n          sumPnL += metrics.realizedPnL;\n          sumNetPnL += metrics.netRealizedPnL;\n        }\n        if (pos.status === 'closed' || metrics.isFullyClosed) {\n          if (pos.journal?.isRuleBreaker) ruleBreakerCount++;\n        }\n        if (pos.status === 'closed' || metrics.isFullyClosed || metrics.realizedPnL !== 0) {\n          closedCount++;\n          if (metrics.netRealizedPnL > 0) wonCount++;\n          else if (metrics.netRealizedPnL < 0) lostCount++;\n        }";
content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/context/TradeContext.tsx', content, 'utf8');

// Analytics.tsx
let aContent = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
aContent = aContent.replace("return pos.status === 'closed' || metrics.isFullyClosed;", "return pos.status === 'closed' || metrics.isFullyClosed || metrics.netRealizedPnL !== 0;");
aContent = aContent.replace("{typeof profitFactor === 'number' ? profitFactor.toFixed(2) : profitFactor}", "{profitFactor > 90 ? 'بلا خسارة' : profitFactor.toFixed(2)}");
fs.writeFileSync('src/components/Analytics.tsx', aContent, 'utf8');

// PortfolioSummary.tsx
let pContent = fs.readFileSync('src/components/PortfolioSummary.tsx', 'utf8');
pContent = pContent.replace("if (p.status === 'closed') {", "if (p.status === 'closed' || m.netRealizedPnL !== 0) {");
pContent = pContent.replace("{profitFactor > 90 ? '∞' : profitFactor.toFixed(2)}", "{profitFactor > 90 ? <span className=\"text-lg\">بلا خسارة</span> : profitFactor.toFixed(2)}");
pContent = pContent.replace("{stats.riskReward > 90 ? '∞' : stats.riskReward.toFixed(1)}", "{stats.riskReward > 90 ? <span className=\"text-[9px]\">بلا خسارة</span> : stats.riskReward.toFixed(1)}");
fs.writeFileSync('src/components/PortfolioSummary.tsx', pContent, 'utf8');

console.log('All fixed.');
