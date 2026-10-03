const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Remove trades from TradeContextType
code = code.replace("  trades: Trade[]; // Legacy backward-compatibility alias\n", "");

// 2. Remove positionToLegacyTrade
const ptStart = code.indexOf('const positionToLegacyTrade =');
if (ptStart > -1) {
    let ptEnd = code.indexOf('};', ptStart);
    code = code.slice(0, ptStart) + code.slice(ptEnd + 2);
}

// 3. Remove trades export from return if it exists again just in case
const trdExp = "\n    trades,";
if (code.includes(trdExp)) {
  code = code.replace(trdExp, "");
}
// Maybe it's `    trades: any[],` or similar? Let's check `trades,` just as a word
code = code.replace(/^[ \t]*trades,[ \t]*$/m, "");

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Fixed trades and positionToLegacyTrade");
