const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// Add unsubLedger to cleanup
code = code.replace("unsubCapital();\n      unsubWeekly();\n    };\n  }, []);", "unsubCapital();\n      unsubWeekly();\n      unsubLedger();\n    };\n  }, []);");

// Remove 'trades' from exports since we use 'positions'
const tradesExport = "\n    trades,";
if (code.includes(tradesExport)) {
    code = code.replace(tradesExport, "");
}

// Remove positionToLegacyTrade if it's unused
const legacyFnIdx = code.indexOf('const positionToLegacyTrade');
if (legacyFnIdx > -1) {
    const endIdx = code.indexOf('};', legacyFnIdx) + 2;
    code = code.slice(0, legacyFnIdx) + code.slice(endIdx);
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Fixed unused vars and missing trades export");
