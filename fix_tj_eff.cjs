const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

if (!code.includes('useEffect')) {
    code = code.replace("import { useState, useMemo, memo }", "import { useState, useMemo, useEffect, memo }");
}
code = code.replace("useMemo(() => {\n    if (activeTradeIdProp)", "useEffect(() => {\n    if (activeTradeIdProp)");
fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Replaced useMemo with useEffect");
