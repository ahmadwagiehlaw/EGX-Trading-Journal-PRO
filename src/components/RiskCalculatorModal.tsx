import { useState } from 'react';
import { X, Calculator, Maximize2, Minimize2 } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';

export default function RiskCalculatorModal({ 
  isOpen, 
  onClose,
  initialSymbol = 'COMI' 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialSymbol?: string;
}) {
  const { capitalInvestment, totalOpenCapitalInvestment } = useTrades();
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');

  if (!isOpen) return null;

  const availableCapital = Math.max(0, capitalInvestment - totalOpenCapitalInvestment);
  const entry = parseFloat(entryPrice);
  const sl = parseFloat(stopLoss);
  
  let riskAmount = 0;
  let shares = 0;
  let rr = 0;

  if (entry > 0 && sl > 0 && entry > sl) {
    const slDistance = entry - sl;
    riskAmount = availableCapital * 0.01; // 1% default risk
    shares = Math.floor(riskAmount / slDistance);
    
    // Max 25% allocation rule
    const maxAllocation = availableCapital * 0.25;
    const sharesByAllocation = Math.floor(maxAllocation / entry);
    shares = Math.min(shares, sharesByAllocation);
    
    const tgt = parseFloat(target);
    if (tgt > entry) {
      rr = (tgt - entry) / slDistance;
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm ${isFullScreen ? 'p-0' : 'p-4'}`} dir="rtl">
      <div className={`bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 ${isFullScreen ? 'w-full h-full rounded-none' : 'rounded-3xl w-full max-w-5xl shadow-2xl max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            حاسبة المخاطر السريعة
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px]">
          
          {/* Chart Section */}
          <div className="flex-1 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 min-h-[300px]">
             <AdvancedRealTimeChart 
                symbol={`EGX:${symbol || 'COMI'}`} 
                theme="dark"
                autosize
                hide_side_toolbar={false}
                allow_symbol_change={true}
                locale="ar_AE"
             />
          </div>

          {/* Calculator Section */}
          <div className="w-full md:w-96 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-white dark:bg-slate-900">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">رمز السهم (للشارت)</label>
              <input 
                type="text" 
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-mono text-center text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="COMI"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">سعر الدخول المقترح</label>
                <input 
                  type="number" 
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl font-mono text-center text-lg font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">وقف الخسارة</label>
                  <input 
                    type="number" 
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 border-none rounded-xl font-mono text-center text-lg font-bold text-red-600 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">الهدف الأول</label>
                  <input 
                    type="number" 
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-none rounded-xl font-mono text-center text-lg font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-slate-800 dark:text-white mb-4 text-center">الكمية المقترحة حسب إدارة المخاطر</h4>
              
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono-num">{shares}</span>
                <span className="text-sm font-bold text-slate-500">سهم</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">المخاطرة (1%)</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 font-mono-num">{riskAmount.toFixed(0)} EGP</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">نسبة العائد للمخاطرة</div>
                  <div className={`font-bold font-mono-num ${rr >= 2 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    1 : {rr > 0 ? rr.toFixed(1) : '0'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
