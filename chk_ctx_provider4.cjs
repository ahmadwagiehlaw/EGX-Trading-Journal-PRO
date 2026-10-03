const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('return <TradeContext.Provider value={contextValue}>');
if (tIdx === -1) {
    const fallback = code.lastIndexOf('return (');
    console.log(code.slice(fallback, fallback + 1000));
} else {
    console.log("Found contextValue");
}
