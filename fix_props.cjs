const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/export default function ActiveTrades\(\{ position, onClose, closePosition, updateTrailingStop \}: ActiveTradesProps\) \{/, "export default function ActiveTrades({ position, updateTrailingStop }: ActiveTradesProps) {\n");
c = c.replace(/interface ActiveTradesProps \{[\s\S]*?\}/, "interface ActiveTradesProps { position: any | null; updateTrailingStop: (id: string, highest: number, stop: number) => void; }");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
