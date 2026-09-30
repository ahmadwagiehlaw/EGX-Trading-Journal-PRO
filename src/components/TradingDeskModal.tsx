import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import StockAutocomplete from './StockAutocomplete';
import TransactionFormModal from './TransactionFormModal';

const SECTORS = [
  'العقارات',
  'البنوك',
  'البتروكيماويات',
  'الخدمات المالية',
  'الموارد الأساسية',
  'الصناعة',
  'أخرى'
];

export default function TradingDeskModal({ 
  isOpen, 
  onClose, 
  initialSymbol = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialSymbol?: string;
}) {
  const { capitalInvestment, capitalSpeculation, positions, addPosition } = useTrades();

  const [activeTab, setActiveTab] = useState<'new-position' | 'new-transaction'>('new-position');
  
  const [portfolioKey, setPortfolioKey] = useState<'investment' | 'speculation'>('investment');
  const [symbol, setSymbol] = useState(initialSymbol);
  const [sector, setSector] = useState(SECTORS[0]);
  const [makerPlan, setMakerPlan] = useState('');

  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  if (!isOpen) return null;

  const isDuplicate = positions.some(p => p.symbol.toLowerCase() === symbol.toLowerCase() && p.status === 'active');

  const handleSave = () => {
    if (isDuplicate || !symbol) return;
    
    addPosition({
      symbol: symbol.toUpperCase(),
      sector,
      portfolioType: portfolioKey,
      status: 'active',
      plan: {
        strategy: makerPlan,
        entryZone: { min: 0, max: 0 },
        target: 0,
        stop: 0,
        atr: 0,
      },
      transactions: [],
      trailingStop: {
        initial: 0,
        current: 0,
        highestReached: 0,
        atrAtEntry: 0,
      },
      journal: {
        openedDate: Date.now(),
        tags: []
      }
    });

    onClose();
  };

  const portfolios = {
    investment: { name: 'استثمار', capital: capitalInvestment },
    speculation: { name: 'مضاربة', capital: capitalSpeculation }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pt-2 px-2">
          <div className="flex-1 flex gap-2">
             <button
                onClick={() => setActiveTab('new-position')}
                className={`py-3 px-4 font-black text-sm flex items-center gap-2 border-b-2 transition-colors ${
                   activeTab === 'new-position' 
                     ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                     : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
             >
                📝 إضافة سهم جديد (مركز)
             </button>
             <button
                onClick={() => setActiveTab('new-transaction')}
                className={`py-3 px-4 font-black text-sm flex items-center gap-2 border-b-2 transition-colors ${
                   activeTab === 'new-transaction' 
                     ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                     : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
             >
                💸 إضافة صفقة (شراء/بيع)
             </button>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 mb-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          
          {activeTab === 'new-position' ? (
            <>
              {isDuplicate && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-500 p-4 rounded-xl flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">هذا السهم موجود بالفعل ضمن المراكز المفتوحة النشطة!</p>
                    <p className="text-xs mt-1">لا يمكنك فتح مركز جديد لنفس السهم. يرجى استخدام زر "إضافة صفقة" من الأعلى.</p>
                  </div>
                </div>
              )}

              {/* Row 1: Symbol & Maker Plan & Sector */}
              <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">السهم (ابحث بالاسم أو الرمز)</label>
              <StockAutocomplete 
                value={symbol}
                onChange={(sym) => setSymbol(sym)}
                placeholder="مثال: COMI..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">القطاع</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">سلوك المزاد / خطة الميكر</label>
              <input 
                type="text" 
                value={makerPlan}
                onChange={(e) => setMakerPlan(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                placeholder="ما هي نية صانع السوق وسبب الدخول؟"
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 block">المحفظة النشطة (رأس المال)</label>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['investment', 'speculation'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setPortfolioKey(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    portfolioKey === key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {portfolios[key].name} ({Number(portfolios[key].capital / 1000).toFixed(0)}k)
                </button>
              ))}
            </div>
          </div>

            </>
          ) : (
            <div className="flex-1 flex flex-col h-full min-h-[400px]">
               <div className="mb-4">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">اختر السهم المفتوح لإضافة صفقة عليه</label>
                  <select 
                     value={symbol}
                     onChange={e => setSymbol(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     <option value="">-- اختر السهم --</option>
                     {positions.filter(p => p.status === 'active').map(p => (
                        <option key={p.id} value={p.symbol}>{p.symbol}</option>
                     ))}
                  </select>
               </div>
               
               {symbol && positions.find(p => p.symbol === symbol && p.status === 'active') ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-white dark:bg-slate-900 flex-1 relative min-h-[500px]">
                     {/* We can just render TransactionFormModal logic here or instruct the user to use it from ActiveTrades. 
                         Wait, TransactionFormModal takes a position prop. Let's just import it and render it inline! */}
                     <TransactionFormModal 
                        isOpen={true}
                        position={positions.find(p => p.symbol === symbol && p.status === 'active')!}
                        onClose={onClose}
                        inline={true}
                     />
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                     <p className="font-bold">يرجى اختيار سهم مفتوح أولاً</p>
                  </div>
               )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {activeTab === 'new-position' && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between mt-auto">
            <p className="text-[11px] text-slate-400 font-bold max-w-[200px]">
              تأكد من تطبيق قواعد إدارة المخاطر قبل الدخول.
            </p>
            <button 
              onClick={handleSave}
              disabled={isDuplicate || !symbol || !sector}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              حفظ وتوثيق المركز
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
