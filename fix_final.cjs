const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/export default function ActiveTrades\(\{ tradeId, onClose \}: \{ tradeId: string; onClose: \(\) => void \}\) \{[\s\S]*?const \{ positions, updateTrailingStop, closePosition \} = useTrades\(\);/, "export default function ActiveTrades({ tradeId }: { tradeId: string }) {\n  const { positions, updateTrailingStop, updatePosition } = useTrades();");

// Fix TS18047 metrics is possibly null:
c = c.replace(/const currentHighest = position.trailingStop\?\.highestReached \|\| metrics\.avgEntry;/g, "if (!position || !metrics) return null;\n\n  const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;");

// Remove Trash2 from import if it didn't work and import it
if (!c.includes('Trash2')) {
  c = c.replace("Target\n}", "Target,\n  Trash2\n}");
}

// Remove unused atr variable
c = c.replace(/const atr = position.trailingStop\?\.atrAtEntry \|\| position.plan\?\.atr \|\| 0;\n    const calculatedNewStop = atr > 0 \? highest - \(2 \* atr\) : highest \* 0\.95;/, "const atrVal = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;\n    const calculatedNewStop = atrVal > 0 ? highest - (2 * atrVal) : highest * 0.95;");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed destructure and null checks');
