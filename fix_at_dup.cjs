const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
code = code.replace(', Trash2\n} from \'lucide-react\';', '\n} from \'lucide-react\';');
fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Fixed duplicate import");
