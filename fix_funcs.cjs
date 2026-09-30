const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const handleUpdateMarketPrice = async \(\) => \{/, "const handleUpdateMarketPrice = async () => {\n    if (!metrics) return;");
c = c.replace(/const handleUpdateAtr = async \(\) => \{/, "const handleUpdateAtr = async () => {\n    if (!metrics) return;");
c = c.replace(/const handleUpdateTrailingStop = async \(\): Promise<boolean> => \{/, "const handleUpdateTrailingStop = async (): Promise<boolean> => {\n    if (!metrics) return false;");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Added null checks to functions');
