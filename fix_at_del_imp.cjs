const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('const { positions, updateTrailingStop, updatePosition, coreStats } = useTrades();');
if (tIdx > -1) {
    code = code.replace(
      'const { positions, updateTrailingStop, updatePosition, coreStats } = useTrades();', 
      'const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats } = useTrades();'
    );
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Added deleteTransaction to useTrades");
}
