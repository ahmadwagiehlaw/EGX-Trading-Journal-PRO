const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/Target\n\} from 'lucide-react';/, "Target,\n  Trash2\n} from 'lucide-react';");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
