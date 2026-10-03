const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('const positionToLegacyTrade');
if (tIdx > -1) {
    const endIdx = code.indexOf('};', tIdx) + 2;
    code = code.slice(0, tIdx) + "/* " + code.slice(tIdx, endIdx) + " */" + code.slice(endIdx);
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Commented out positionToLegacyTrade");
}
