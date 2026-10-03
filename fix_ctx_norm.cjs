const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const targetStr = "currentMarketPrice: raw.currentMarketPrice";
if (code.includes(targetStr)) {
    code = code.replace(targetStr, "currentMarketPrice: raw.currentMarketPrice,\n      coreShares: raw.coreShares");
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Fixed normalizePosition to include coreShares!");
} else {
    console.log("Could not find targetStr");
}
