import { useState, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import TradesJournal from './components/TradesJournal';
import CashLedger from './components/CashLedger';
import CommandPalette from './components/CommandPalette';
import ReloadPrompt from './components/ReloadPrompt';
import { Target } from 'lucide-react';

// Lazy load heavy analytics and tradingview widgets for instantaneous startup
const Analytics = lazy(() => import('./components/Analytics'));
const Settings = lazy(() => import('./components/Settings'));
const TradingDeskModal = lazy(() => import('./components/TradingDeskModal'));

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
    console.log("Adding to watchlist:", tradeData);
    setActiveTab('قائمة المراقبة');
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className={activeTab === 'لوحة القيادة' ? 'block' : 'hidden'}>
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

        <Suspense fallback={
          <div className="py-20 text-center font-bold text-slate-400">جاري التحميل...</div>
        }>
          {activeTab === 'التحليلات' && <Analytics />}
          {activeTab === 'الخزينة' && <CashLedger />}
          {activeTab === 'الإعدادات' && <Settings />}
        </Suspense>
        
        <CommandPalette 
          open={isCommandPaletteOpen} 
          setOpen={setIsCommandPaletteOpen} 
          setActiveTab={setActiveTab} 
          onStartTrade={() => handleStartTrade(null)} 
        />
      </Layout>

      {/* Floating Action Button (FAB) for Trading Desk - Positioned higher on mobile to avoid bottom nav bar */}
      <button 
        onClick={() => setIsTradingDeskOpen(true)}
        className="fixed bottom-20 left-4 md:bottom-8 md:left-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-3.5 md:p-4 shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all z-40 flex items-center justify-center"
        title="غرفة العمليات (حاسبة المخاطر والشارت)"
      >
        <Target className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Lazy Trading Desk Modal */}
      {isTradingDeskOpen && (
        <Suspense fallback={null}>
          <TradingDeskModal 
            isOpen={isTradingDeskOpen}
            onClose={() => setIsTradingDeskOpen(false)}
            onStartTrade={handleStartTrade}
            onAddToWatchlist={handleAddToWatchlist}
            initialSymbol={tradingDeskSymbol}
          />
        </Suspense>
      )}

      {/* PWA Background Update Notification */}
      <ReloadPrompt />
    </>
  );
}

export default App;
