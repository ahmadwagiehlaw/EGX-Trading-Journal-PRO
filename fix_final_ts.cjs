const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/export default function ActiveTrades\(\{ tradeId \}: \{ tradeId: string \}\) \{/, "export default function ActiveTrades({ tradeId, onClose }: { tradeId: string; onClose?: () => void }) {\n");
c = c.replace(/const atr = position!\.trailingStop\?\.atrAtEntry \|\| position!\.plan\?\.atr \|\| 0;/g, "");
if (!c.includes('Trash2')) {
  c = c.replace("Target,\n", "Target,\n  Trash2,\n");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed final TS errors');
