const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const target = 'const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;';
content = content.replace(target, 'if (!position || !metrics) return null;\n\n  ' + target);

// Also remove the unused imports onClose, closePosition, LineChart
content = content.replace("LineChart,", "");
content = content.replace("onClose?: () => void", "");
content = content.replace("{ tradeId }: { tradeId: string;  }", "{ tradeId }: { tradeId: string }");

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Restored null check and fixed imports');
