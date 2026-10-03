const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tIdx = code.indexOf('<TradesJournal');
const eIdx = code.indexOf('/>', tIdx) + 2;

const tjRenderNew = `<TradesJournal 
            draftTrade={draftTrade} 
            isNewTradeOpen={isNewTradeModalOpen} 
            setIsNewTradeOpen={setIsNewTradeModalOpen} 
            activeTradeIdProp={activeTradeId}
            onCloseActiveTrade={() => setActiveTradeId(null)}
          />`;
code = code.slice(0, tIdx) + tjRenderNew + code.slice(eIdx);

// Also fix onOpenTrade in Dashboard
const dIdx = code.indexOf('<Dashboard onNavigate={setActiveTab} />');
if (dIdx > -1) {
    code = code.replace('<Dashboard onNavigate={setActiveTab} />', '<Dashboard onNavigate={setActiveTab} onOpenTrade={(id) => { setActiveTradeId(id); setActiveTab(\'سجل الصفقات\'); }} />');
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Fixed App.tsx render issues");
