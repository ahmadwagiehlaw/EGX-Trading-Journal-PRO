import { useState, lazy, Suspense, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StickyNotesPanel from './components/StickyNotesPanel';
import { Pin } from 'lucide-react';
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
const RiskCalculatorModal = lazy(() => import('./components/RiskCalculatorModal'));

export default function App() {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('لوحة القيادة');
  const [draftTrade, setDraftTrade] = useState<any>(null);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [isTradingDeskOpen, setIsTradingDeskOpen] = useState(false);
  const [tradingDeskSymbol, setTradingDeskSymbol] = useState('COMI');

  const handleStartTrade = useCallback((tradeData: any) => {
    setDraftTrade(tradeData);
    setActiveTab('سجل الصفقات');
    setIsNewTradeModalOpen(true);
  }, []);


  const handleOpenTradingDesk = useCallback((sym?: string) => {
    setTradingDeskSymbol(sym || 'COMI');
    setIsTradingDeskOpen(true);
  }, []);

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className={activeTab === 'لوحة القيادة' || activeTab === 'الرئيسية' ? 'block' : 'hidden'}>
          <Dashboard 
            onOpenTradingDesk={handleOpenTradingDesk} 
            onNavigate={setActiveTab}
          />
        </div>
        
        <div className={activeTab === 'استراتيجيات التداول' ? 'block' : 'hidden'}>
          <Watchlist onMoveToJournal={handleStartTrade} />
        </div>
        
        <div className={activeTab === 'سجل الصفقات' ? 'block' : 'hidden'}>
          <TradesJournal 
            draftTrade={draftTrade} 
            isNewTradeOpen={isNewTradeModalOpen} 
            setIsNewTradeOpen={setIsNewTradeModalOpen} 
            activeTradeIdProp={activeTradeId}
            onCloseActiveTrade={() => setActiveTradeId(null)}
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

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsTradingDeskOpen(true)}
        className={`fixed bottom-20 left-4 md:bottom-8 md:left-8 text-white rounded-2xl p-3.5 md:p-4 shadow-xl hover:-translate-y-0.5 transition-all z-40 flex items-center justify-center ${activeTab === 'الرئيسية' || activeTab === 'لوحة القيادة' ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40' : activeTab === 'استراتيجيات التداول' ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/40' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/40'}`}
        title={activeTab === 'الرئيسية' || activeTab === 'لوحة القيادة' ? 'حاسبة المخاطر' : activeTab === 'استراتيجيات التداول' ? 'إضافة استراتيجية' : 'إضافة مركز/صفقة'}
      >
        <Target className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Dynamic Modal based on activeTab */}
      {isTradingDeskOpen && (
        <Suspense fallback={null}>
          {(activeTab === 'الرئيسية' || activeTab === 'لوحة القيادة') ? (
            <RiskCalculatorModal 
              isOpen={isTradingDeskOpen} 
              onClose={() => setIsTradingDeskOpen(false)} 
              initialSymbol={tradingDeskSymbol}
            />
          ) : (
            <TradingDeskModal 
              isOpen={isTradingDeskOpen}
              onClose={() => setIsTradingDeskOpen(false)}
              initialSymbol={tradingDeskSymbol}
            />
          )}
        </Suspense>
      )}

      {/* PWA Background Update Notification */}
      <ReloadPrompt />
      <button 
        onClick={() => setIsNotesOpen(true)}
        className="fixed bottom-40 left-4 md:bottom-28 md:left-8 z-40 p-3.5 md:p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
        title="ملاحظات وأفكار"
      >
        <Pin className="w-6 h-6" />
      </button>

      <StickyNotesPanel isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </>
  );
}