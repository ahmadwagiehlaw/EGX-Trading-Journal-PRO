import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ActiveTrades from './components/ActiveTrades';
import NewTradeForm from './components/NewTradeForm';
import Analytics from './components/Analytics';
import TradesJournal from './components/TradesJournal';
import Settings from './components/Settings';
import Watchlist from './components/Watchlist';
import CommandPalette from './components/CommandPalette';

function App() {
  const [activeTab, setActiveTab] = useState('لوحة القيادة');
  const [draftTrade, setDraftTrade] = useState<any>(null);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleStartTrade = (tradeData: any) => {
    setDraftTrade(tradeData);
    setActiveTab('سجل الصفقات');
    setIsNewTradeModalOpen(true);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className={activeTab === 'لوحة القيادة' ? 'block h-full' : 'hidden'}>
        <Dashboard onStartTrade={handleStartTrade} />
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
  );
}

export default App;
