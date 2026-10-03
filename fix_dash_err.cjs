const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tIdx = code.indexOf('export default memo(function Dashboard({');
const eIdx = code.indexOf('}) {', tIdx) + 4;

const newSig = `export default memo(function Dashboard({ 
  onOpenTradingDesk,
  onNavigate,
  onOpenTrade
}: { 
  onOpenTradingDesk?: (symbol?: string) => void;
  onNavigate?: (tab: string) => void;
  onOpenTrade?: (id: string) => void;
}) {`;

code = code.slice(0, tIdx) + newSig + code.slice(eIdx);
fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
console.log("Fixed Dashboard props");
