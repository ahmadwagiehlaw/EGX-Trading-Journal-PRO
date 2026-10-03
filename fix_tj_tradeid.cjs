const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

// Props
const propTarget = `export default memo(function TradesJournal({
  draftTrade,
  isNewTradeOpen,
  setIsNewTradeOpen
}: {
  draftTrade: any;
  isNewTradeOpen: boolean;
  setIsNewTradeOpen: (v: boolean) => void;
}) {`;

const propNew = `export default memo(function TradesJournal({
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
code = code.replace(propTarget, propNew);

// State hook
const stateHookTarget = `  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);`;
const stateHookNew = `  const [activeTradeIdState, setActiveTradeIdState] = useState<string | null>(null);
  
  // Use prop if available, otherwise local state
  const activeTradeId = activeTradeIdProp || activeTradeIdState;
  
  const handleSetActiveTradeId = (id: string | null) => {
    setActiveTradeIdState(id);
    if (!id && onCloseActiveTrade) {
      onCloseActiveTrade();
    }
  };
`;
code = code.replace(stateHookTarget, stateHookNew);

// Replace setActiveTradeId calls
code = code.replace(/setActiveTradeId\(/g, "handleSetActiveTradeId(");

fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Updated TradesJournal.tsx");
