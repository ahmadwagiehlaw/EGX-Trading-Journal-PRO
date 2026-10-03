const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const importIdx = code.indexOf("} from 'lucide-react';");
code = code.slice(0, importIdx) + ", X, Pencil, Sparkles, Trash2\n" + code.slice(importIdx);
if (!code.includes("import ConfirmModal")) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Fixed imports");
