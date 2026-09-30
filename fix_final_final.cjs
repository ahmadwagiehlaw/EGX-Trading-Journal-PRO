const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/export default function ActiveTrades\(\{ tradeId, onClose \}: \{ tradeId: string; onClose\?: \(\) => void \}\) \{/, "export default function ActiveTrades({ tradeId }: { tradeId: string; onClose?: () => void }) {\n");

if (!c.includes('Trash2')) {
  c = c.replace(/import \{\s*ArrowDownToLine,[\s\S]*?\} from 'lucide-react';/, "import { ArrowDownToLine, Lock, Maximize2, Minimize2, ShieldAlert, CheckCircle, Plus, ArrowDownLeft, LineChart, Target, Trash2 } from 'lucide-react';");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
