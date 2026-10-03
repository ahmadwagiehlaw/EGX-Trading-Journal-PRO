const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const tIdx = code.indexOf('const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);');
if (tIdx > -1) {
    const newState = `const [expandedPositionId, setExpandedPositionId] = useState<string | null>(activeTradeIdProp || null);

  useEffect(() => {
    if (activeTradeIdProp) {
      setExpandedPositionId(activeTradeIdProp);
    }
  }, [activeTradeIdProp]);
`;
    code = code.slice(0, tIdx) + newState + code.slice(tIdx + 82);
}

// And the click handler:
const oldClick = "setExpandedPositionId(expandedPositionId === pos.id ? null : pos.id)";
const newClick = `if (expandedPositionId === pos.id) {
                            setExpandedPositionId(null);
                            onCloseActiveTrade?.();
                          } else {
                            setExpandedPositionId(pos.id);
                          }`;
if (code.includes(oldClick)) {
    code = code.replace(oldClick, newClick);
}

// Remove unused Edit2 from WeeklyReviewTab
let wrt = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
wrt = wrt.replace("Target, Edit2 }", "Target }");
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', wrt, 'utf8');

fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Fixed TradesJournal state");
