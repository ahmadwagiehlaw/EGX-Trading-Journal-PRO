const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('export default memo(function TradesJournal({');
const eIdx = code.indexOf('}) {', tIdx) + 4;

const newSig = `export default memo(function TradesJournal({
  draftTrade,
  isNewTradeOpen,
  setIsNewTradeOpen,
  activeTradeIdProp,
  onCloseActiveTrade
}: {
  draftTrade: any;
  isNewTradeOpen: boolean;
  setIsNewTradeOpen: (v: boolean) => void;
  activeTradeIdProp?: string | null;
  onCloseActiveTrade?: () => void;
}) {`;

code = code.slice(0, tIdx) + newSig + code.slice(eIdx);
fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Fixed TradesJournal.tsx signature");
