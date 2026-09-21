import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import TradesJournal from './components/TradesJournal';
import Settings from './components/Settings';
import Watchlist from './components/Watchlist';
import CommandPalette from './components/CommandPalette';
import TradingDeskModal from './components/TradingDeskModal';
import { Target } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('لوحة القيادة');
  const [draftTrade, setDraftTrade] = useState<any>(null);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTradingDeskOpen, setIsTradingDeskOpen] = useState(false);
  const [tradingDeskSymbol, setTradingDeskSymbol] = useState('COMI');

  const handleStartTrade = (tradeData: any) => {
    setDraftTrade(tradeData);
    setActiveTab('سجل الصفقات');
    setIsNewTradeModalOpen(true);
  };

  const handleAddToWatchlist = (tradeData: any) => {
    // In the future, pass this data to Watchlist's New Plan form
    console.log("Adding to watchlist:", tradeData);
    setActiveTab('قائمة المراقبة');
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className={activeTab === 'لوحة القيادة' ? 'block h-full' : 'hidden'}>
          <Dashboard 
            onOpenTradingDesk={(sym) => {
              setTradingDeskSymbol(sym || 'COMI');
              setIsTradingDeskOpen(true);
            }} 
            onNavigate={setActiveTab}
          />
        </div>
        <div className={activeTab === 'قائمة المراقبة' ? 'block' : 'hidden'}>
          <Watchlist onMoveToJournal={handleStartTrade} />
        </div>
        <div className={activeTab === 'سجل الصفقات' ? 'block' : 'hidden'}>
          <TradesJournal 
            draftTrade={draftTrade} 
            isNewTradeOpen={isNewTradeModalOpen} 
            setIsNewTradeOpen={setIsNewTradeModalOpen} 
          />
        </div>
        <div className={activeTab === 'التحليلات' ? 'block' : 'hidden'}>
          <Analytics />
        </div>
        <div className={activeTab === 'الإعدادات' ? 'block' : 'hidden'}>
          <Settings />
        </div>
        
        <CommandPalette 
          open={isCommandPaletteOpen} 
          setOpen={setIsCommandPaletteOpen} 
          setActiveTab={setActiveTab} 
          onStartTrade={() => handleStartTrade(null)} 
        />
      </Layout>

      {/* Floating Action Button (FAB) for Trading Desk */}
      <button 
        onClick={() => setIsTradingDeskOpen(true)}
        className="fixed bottom-6 left-6 md:bottom-10 md:left-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all z-40 group flex items-center justify-center"
        title="غرفة العمليات (حاسبة المخاطر والشارت)"
      >
        <Target className="w-8 h-8 group-hover:scale-110 transition-transform" />
        <span className="absolute left-16 bg-slate-900 text-white text-sm font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          غرفة العمليات (Trading Desk)
        </span>
      </button>

      <TradingDeskModal 
        isOpen={isTradingDeskOpen}
        onClose={() => setIsTradingDeskOpen(false)}
        onStartTrade={handleStartTrade}
        onAddToWatchlist={handleAddToWatchlist}
        initialSymbol={tradingDeskSymbol}
      />
    </>
  );
}

export default App;

