const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/const contextValue = useMemo\(\(\) => \(\{/g, "const contextValue = useMemo(() => ({\n    isSimulator,\n    toggleSimulator,");

c = c.replace(/disciplineScore, loading, commissionRate\n  \]\);/g, "disciplineScore, loading, commissionRate, isSimulator\n  ]);");

// Wait, the regex I used before might have injected something weird.
// `return (\n    <TradeContext.Provider value={{\n      isSimulator,\n      toggleSimulator,`
// Let's remove that weird injection.
c = c.replace(/return \(\n    <TradeContext\.Provider value=\{\{\n      isSimulator,\n      toggleSimulator,/, "return (\n    <TradeContext.Provider value={{");

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('Fixed contextValue');
