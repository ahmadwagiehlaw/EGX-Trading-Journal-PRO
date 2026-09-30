const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/export default function ActiveTrades\(\{ tradeId, onClose \}: \{ tradeId: string; onClose: \(\) => void \}\) \{/, "export default function ActiveTrades({ tradeId }: { tradeId: string; onClose: () => void }) {\n");
c = c.replace(/const \{ positions, updateTrailingStop, closePosition, updatePosition \} = useTrades\(\);/, "const { positions, updateTrailingStop, updatePosition } = useTrades();");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
