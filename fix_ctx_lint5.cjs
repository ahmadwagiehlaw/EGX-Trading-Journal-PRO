const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('function positionToLegacyTrade(pos: TickerPosition): Trade {');
if (tIdx > -1) {
    const endIdx = code.indexOf('  return legacy;\n}', tIdx) + 19;
    code = code.slice(0, tIdx) + "/* \n" + code.slice(tIdx, endIdx) + "\n */" + code.slice(endIdx);
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Commented out function positionToLegacyTrade explicitly");
} else {
    console.log("Could not find function declaration.");
}
