const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add activeTradeId state
const stateInsert = `
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
`;
code = code.replace("const [isTradingDeskOpen", stateInsert + "  const [isTradingDeskOpen");

// 2. Pass it to Dashboard
code = code.replace("<Dashboard onNavigate={setActiveTab} />", "<Dashboard onNavigate={setActiveTab} onOpenTrade={(id) => { setActiveTradeId(id); setActiveTab('سجل الصفقات'); }} />");

// 3. Pass it to TradesJournal
const tjRender = `<TradesJournal 
            draftTrade={draftTrade} 
            isNewTradeOpen={isNewTradeModalOpen} 
            setIsNewTradeOpen={setIsNewTradeModalOpen} 
          />`;
const tjRenderNew = `<TradesJournal 
            draftTrade={draftTrade} 
            isNewTradeOpen={isNewTradeModalOpen} 
            setIsNewTradeOpen={setIsNewTradeModalOpen} 
            activeTradeIdProp={activeTradeId}
            onCloseActiveTrade={() => setActiveTradeId(null)}
          />`;
code = code.replace(tjRender, tjRenderNew);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Updated App.tsx");
