const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

// The new signature is already correct.
// We just need to update expandedPositionId logic.
const oldState = "const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);";
const newState = `const [expandedPositionId, setExpandedPositionId] = useState<string | null>(activeTradeIdProp || null);

  // Sync prop to state if it changes
  useMemo(() => {
    if (activeTradeIdProp) {
      setExpandedPositionId(activeTradeIdProp);
    }
  }, [activeTradeIdProp]);
`;
code = code.replace(oldState, newState);

// Let's also fix the unused imports in WeeklyReviewTab
code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
code = code.replace("Target, Edit2, Trash2 }", "Target, Edit2 }");
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Fixed unused imports");

// I also need to make sure onCloseActiveTrade is used.
// When closing the expanded position, we should call it.
// In TradesJournal: setExpandedPositionId(expandedPositionId === pos.id ? null : pos.id)
code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
const oldClick = "setExpandedPositionId(expandedPositionId === pos.id ? null : pos.id)";
const newClick = `if (expandedPositionId === pos.id) {
                            setExpandedPositionId(null);
                            onCloseActiveTrade?.();
                          } else {
                            setExpandedPositionId(pos.id);
                          }`;
code = code.replace(oldClick, newClick);
fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');

console.log("Fixed TradesJournal state");
