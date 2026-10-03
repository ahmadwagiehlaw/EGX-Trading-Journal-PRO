const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

code = code.replace("  trades: any[];\n", "");

const legIdx = code.indexOf('const positionToLegacyTrade =');
if (legIdx > -1) {
    const nextLine = code.indexOf('\n\n', legIdx);
    if (nextLine > -1) {
        code = code.slice(0, legIdx) + code.slice(nextLine);
    }
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Fixed TradeContextType and legacy function");
