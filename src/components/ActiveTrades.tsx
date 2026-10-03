import ConfirmModal from './ConfirmModal';
import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Lock, 
  Maximize2,
  Minimize2,
  ShieldAlert, 
   
  CheckCircle, 
  Plus,
  ArrowDownLeft,
  
  Target,
  Trash2
, X, Pencil, Sparkles
} from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { computePositionMetrics, computeOpenLotsLowestPriceFirst } from '../utils/calculations';
import TransactionFormModal from './TransactionFormModal';

export default function ActiveTrades({ tradeId }: { tradeId: string; onClose?: () => void }) {


  const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats } = useTrades();
  const { theme } = useTheme();
  
  const position = positions.find(p => p.id === tradeId);
  const metrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position);
  }, [position]);

  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);
  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);
  const [isEditingAtr, setIsEditingAtr] = useState(false);
  const [atrInput, setAtrInput] = useState('');
  const [isEditingStop, setIsEditingStop] = useState(false);
  const [manualStopInput, setManualStopInput] = useState('');
  
  const handleManualStopUpdate = async () => {
    const val = parseFloat(manualStopInput);
    if (!isNaN(val) && val > 0 && position) {
      const updatedData: any = { trailingStop: { ...position.trailingStop, current: val } };
      await updatePosition(position.id, updatedData);
      setIsEditingStop(false);
    }
  };

  useEffect(() => {
    if (isEditingAtr && position) {
      const currentAtr = position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0;
      setAtrInput(currentAtr.toString());
    }
  }, [isEditingAtr, position]);

  const handleUpdateMarketPrice = async () => {
    if (!metrics) return;
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position!.id, { currentMarketPrice: p });
      setIsEditingMarketPrice(false);
    }
  };

  const handleUpdateAtr = async () => {
    if (!metrics) return;
    const newAtr = parseFloat(atrInput);
    if (!isNaN(newAtr) && newAtr > 0 && position) {
      const updatedData: any = {};
      
      const highest = position!.trailingStop?.highestReached || metrics!.avgEntry;
      let newStop = highest - (2 * newAtr);
      newStop = Math.max(newStop, metrics!.currentStop);

      if (position!.trailingStop) {
        updatedData.trailingStop = { ...position!.trailingStop, atrAtEntry: newAtr, current: newStop };
      } else {
        updatedData.trailingStop = { initial: metrics!.currentStop, current: newStop, highestReached: highest, atrAtEntry: newAtr };
      }
      
      if (position!.plan) {
        updatedData.plan = { ...position!.plan, atr: newAtr };
      }
      
      await updatePosition(position!.id, updatedData);
      setIsEditingAtr(false);
    }
  };

  
  
  
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  
  useEffect(() => {
    if (!isEditingCoreShares && position) {
      setCoreSharesInput(position.coreShares?.toString() || '');
    }
  }, [position?.coreShares, isEditingCoreShares, position]);

  const handleSaveCoreShares = async () => {
    if (!position || !metrics) return;
    const val = parseInt(coreSharesInput);
    if (isNaN(val) || val < 0 || val > metrics.openShares) {
      alert('يجب أن تكون كمية الكور رقم صحيح بين 0 والكمية المفتوحة بالكامل (' + metrics.openShares + ')');
      return;
    }
    await updatePosition(position.id, { coreShares: val });
    setIsEditingCoreShares(false);
  };

  const generateInsights = () => {
    if (!position || !metrics) return [];
    const insights = [];
    const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;
    
    if (pnlPercent > 15) {
      insights.push({ type: 'success', text: `أنت محقق ربح ممتاز بحوالي ${pnlPercent.toFixed(1)}% في هذا التمركز. يوصى بجني جزء من الأرباح (بيع جزئي) لتأمين المكسب.`, action: 'بيع جزئي' });
    } else if (pnlPercent < -8) {
      insights.push({ type: 'warning', text: `التمركز خاسر بنسبة ${Math.abs(pnlPercent).toFixed(1)}%. راقب وقف الخسارة بصرامة ولا تترك الخسارة تتفاقم.` });
    }

    const riskPercent = metrics.avgEntry > 0 ? ((metrics.avgEntry - metrics.currentStop) / metrics.avgEntry) * 100 : 0;
    if (pnlPercent > 5 && riskPercent > 0) {
      insights.push({ type: 'info', text: 'السعر ارتفع بشكل جيد لكن وقف الخسارة لا يزال تحت سعر الدخول. يوصى برفع وقف الخسارة (Trailing Stop) لنقطة الدخول أو أعلى لحماية رأس المال.' });
    }

    if (position.portfolioType === 'investment') {
      const coreAmount = position.coreShares ? position.coreShares * (position.currentMarketPrice || 0) : 0;
      const totalCap = coreStats?.totalInvestmentCapital || 1;
      const coreWeight = (coreAmount / totalCap) * 100;
      
      if (coreAmount === 0 && position.plan?.strategy === 'core') {
         insights.push({ type: 'info', text: 'هذا السهم مصنف كـ (Core) لكنك لم تحدد كمية الكور المحتفظ بها. قم بتحديد أسهم الكور لحمايتها من البيع العاطفي.' });
      } else if (coreWeight > 30) {
         insights.push({ type: 'warning', text: `وزن هذا السهم الأساسي يشكل ${coreWeight.toFixed(1)}% من إجمالي محفظة الاستثمار. هذا تركز عالي وقد يزيد المخاطرة، فكر في إعادة التوازن.` });
      }
    }

    if (position.portfolioType === 'speculation' && position.journal?.openedDate) {
      const daysHeld = (Date.now() - position.journal.openedDate) / (1000 * 60 * 60 * 24);
      if (daysHeld > 14 && pnlPercent < 2) {
        insights.push({ type: 'warning', text: `هذا التمركز المضاربي مستمر منذ ${Math.floor(daysHeld)} يوم بدون ربح يذكر. انتبه لتكلفة الفرصة البديلة (Cash Drag).` });
      }
    }

    if (insights.length === 0) {
      insights.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    return insights;
  };
  const insights = generateInsights();

if (!position || !metrics) return null;

  const currentHighest = position!.trailingStop?.highestReached || metrics!.avgEntry;
  const currentStop = metrics!.currentStop;
  

  const handleUpdateTrailingStop = async (): Promise<boolean> => {
    if (!metrics) return false;
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (${currentHighest.toFixed(2)} EGP).`);
      return false;
    }

    const atrVal = position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0;
    const calculatedNewStop = atrVal > 0 ? highest - (2 * atrVal) : highest * 0.95;
    const finalStop = Math.max(calculatedNewStop, currentStop);

    setError(null);
    await updateTrailingStop(position!.id, highest, finalStop);
    setNewHighestPrice('');
    setIsEditingHighestPrice(false);
    return true;
  };


  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className={isChartExpanded ? "flex flex-col" : "grid lg:grid-cols-2 gap-6 items-stretch"}>
        
        {/* Right Column: Live TradingView Chart OR Ledger */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${isChartExpanded ? 'h-[80vh]' : 'min-h-[520px]'}`}>
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button 
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
              title={isChartExpanded ? "تصغير" : "تكبير"}
            >
              {isChartExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setRightPaneView(rightPaneView === 'ledger' ? 'chart' : 'ledger')}
              className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-2 font-black text-xs"
            >
              {rightPaneView === 'ledger' ? 'الشارت الفني' : 'سجل صفقات السهم'}
            </button>
          </div>

          {rightPaneView === 'ledger' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 mt-14">
               <div className="flex flex-wrap gap-2 mb-6">
                 <button onClick={() => setTxModalType('buy')} className="flex-1 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl font-black text-xs border border-blue-200 dark:border-blue-800">+ تمركز إضافي</button>
                 <button onClick={() => setTxModalType('sell')} className="flex-1 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl font-black text-xs border border-emerald-200 dark:border-emerald-800">↙ بيع جزئي</button>
                 <button className="flex-1 py-2 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl font-black text-xs border border-amber-200 dark:border-amber-800 opacity-50 cursor-not-allowed">توزيع نقدي</button>
                 <button className="flex-1 py-2 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-xl font-black text-xs border border-purple-200 dark:border-purple-800 opacity-50 cursor-not-allowed">تجزئة/مجاني</button>
               </div>

               
             {/* Smart Insights Panel (AI Advisor) */}
             {insights.length > 0 && (
               <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-8 shadow-sm">
                 <div className="flex items-center gap-2 mb-3">
                   <Sparkles className="w-5 h-5 text-indigo-500" />
                   <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI) والتوصيات</h3>
                 </div>
                 <div className="grid gap-2">
                   {insights.map((insight, idx) => (
                     <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${
                       insight.type === 'warning' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                       insight.type === 'success' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                       'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                     }`}>
                       <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                       {insight.action && (
                         <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 transition-transform flex-shrink-0">
                           {insight.action}
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Open Lots (Lowest Price First / FIFO) Table */}
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Target className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">الدفعات المفتوحة (Open Lots)</h3>
                 </div>
                 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800/50">
                   قاعدة: الأقل سعراً أولاً (Lowest-Price First)
                 </span>
               </div>
               
               <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">تاريخ الشراء</th>
                       <th className="py-3 px-2">سعر الشراء</th>
                       <th className="py-3 px-2">الكمية المتبقية</th>
                       <th className="py-3 px-2">الربح/الخسارة</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراء</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {computeOpenLotsLowestPriceFirst(position!.transactions).map(lot => {
                       const lotValue = lot.remainingShares * metrics!.currentPrice;
                       const lotCost = lot.remainingShares * lot.price;
                       const lotPnL = lotValue - lotCost;
                       const lotPnLPercent = lotCost > 0 ? (lotPnL / lotCost) * 100 : 0;
                       const isWinning = lotPnL > 0;
                       
                       return (
                         <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                           <td className="py-3 px-2">{new Date(lot.date).toLocaleDateString('en-GB')}</td>
                           <td className="py-3 px-2 text-blue-600 dark:text-blue-400">{lot.price.toFixed(2)}</td>
                           <td className="py-3 px-2">{lot.remainingShares.toLocaleString()} سهم</td>
                           <td className={`py-3 px-2 ${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                             {lotPnL > 0 ? '+' : ''}{lotPnL.toFixed(2)} ({lotPnLPercent.toFixed(1)}%)
                           </td>
                           <td className="py-3 px-2">
                             <button 
                               onClick={() => setTxModalType('sell')}
                               className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                             >
                               جني ربح
                             </button>
                           </td>
                         </tr>
                       );
                     })}
                     {computeOpenLotsLowestPriceFirst(position!.transactions).length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-8 text-slate-400 text-xs font-bold">لا توجد دفعات مفتوحة حالياً.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
             
             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-400" />
                سجل الحركات الكامل
             </h3>

               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">العملية</th>
                       <th className="py-3 px-2">التاريخ</th>
                       <th className="py-3 px-2">الكمية</th>
                       <th className="py-3 px-2">السعر</th>
                       <th className="py-3 px-2">الإجمالي</th>
                       <th className="py-3 px-2">الربح المحقق</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراءات</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {[...position!.transactions].sort((a,b)=>b.date - a.date).map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num">
                         <td className="py-4 px-2">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${tx.type === 'buy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                             {tx.type === 'buy' ? 'شراء' : 'بيع (جني ربح)'}
                           </span>
                         </td>
                         <td className="py-4 px-2 font-bold text-slate-600 dark:text-slate-300 text-xs">
                           {new Date(tx.date).toLocaleDateString('en-GB')}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.shares.toLocaleString()}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.price.toFixed(2)}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.amount.toFixed(2)}
                         </td>
                         <td className="py-4 px-2">
                           {tx.type === 'sell' && tx.id ? (
                             <span className={`font-black ${(metrics!.txPnL?.[tx.id] || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                               {(metrics!.txPnL?.[tx.id] || 0) >= 0 ? '+' : ''}{(metrics!.txPnL?.[tx.id] || 0).toFixed(2)}
                             </span>
                           ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                         </td>
                         <td className="py-4 px-2 flex justify-center">
                            <button 
                              onClick={() => setConfirmTxId(tx.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف المعاملة"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            <AdvancedRealTimeChart 
              symbol={`EGX:${position!.symbol}`}
              interval="D"
              theme={theme === 'dark' ? 'dark' : 'light'}
              locale="ar_AE"
              autosize
              allow_symbol_change={false}
              hide_side_toolbar={false}
              details={true}
              save_image={true}
              timezone="Africa/Cairo"
            />
          )}
        </div>

        {/* Left Column: Trailing Stop Engine & Ledger Control */}
        <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex-col justify-between space-y-6 shadow-sm ${isChartExpanded ? 'hidden' : 'flex'}`}>

          <div>
            {/* Header / Ticker Summary */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                    metrics!.isOpen 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)} EGP</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل سعر السوق يدوياً"
                    >
                      سعر السوق:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics!.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateMarketPrice}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل السعر"
                      >
                        {metrics!.currentPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Highest Price Pill (Trailing Stop) */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      title="تحديث أعلى سعر لتفعيل الوقف المتحرك"
                    >
                      <Lock className="w-3 h-3" />
                      أقصى سعر:
                    </button>
                    {isEditingHighestPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={newHighestPrice}
                          onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateTrailingStop}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* ATR Pill */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingAtr(!isEditingAtr); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة ATR لحساب الوقف الميكانيكي"
                    >
                      ATR:
                    </button>
                    {isEditingAtr ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={atrInput}
                          onChange={(e) => setAtrInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-purple-900 dark:text-purple-100"
                          dir="ltr"
                          autoFocus
                          placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateAtr}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-purple-800 dark:text-purple-200 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل ATR"
                      >
                        {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                {error && isEditingHighestPrice && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block w-full max-w-sm">
                    {error}
                  </p>
                )}
              </div>

              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics!.openShares.toLocaleString()} سهم</p>
              </div>
            </div>

            {/* Plan vs Reality Visual Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-10 rounded-3xl border border-slate-200 dark:border-slate-700/60 mb-6 relative mt-6 shadow-inner">
              <div className={`absolute -top-4 left-4 z-10 px-3 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 border shadow-sm ${
                metrics!.realizedPnL > 0 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-300' 
                  : metrics!.realizedPnL < 0 
                    ? 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-300' 
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}>
                صافي الأرباح المحققة: {metrics!.realizedPnL > 0 ? '+' : ''}{metrics!.realizedPnL.toFixed(2)} EGP
              </div>
              
              <div className="relative h-16 w-full flex items-center mt-8 mb-4">
                {/* Track */}
                <div className="absolute w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full shadow-inner overflow-hidden">
                  {position!.plan?.target && position!.plan?.stop ? (
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-400 to-rose-500 opacity-90"
                      style={{ width: '100%' }}
                    />
                  ) : null}
                </div>

                {/* Markers */}
                {position!.plan?.target && position!.plan?.stop ? (() => {
                  const minP = position!.plan.stop;
                  const maxP = position!.plan.target;
                  const range = maxP - minP;
                  const entryPercent = Math.max(0, Math.min(100, ((metrics!.avgEntry - minP) / range) * 100));
                  const trailingStopPercent = Math.max(0, Math.min(100, ((currentStop - minP) / range) * 100));
                  const currentPercent = Math.max(0, Math.min(100, ((metrics!.currentPrice - minP) / range) * 100));

                  return (
                    <>
                      {/* Initial Stop */}
                      <div className="absolute flex flex-col items-center" style={{ right: '0%', transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> الوقف</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{minP.toFixed(2)}</span>
                      </div>
                      
                      {/* Target */}
                      <div className="absolute flex flex-col items-center" style={{ right: '100%', transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Target className="w-3 h-3"/> الهدف</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{maxP.toFixed(2)}</span>
                      </div>

                      {/* Entry */}
                      <div className="absolute flex flex-col items-center" style={{ right: `${entryPercent}%`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">الدخول</span>
                        <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{metrics!.avgEntry.toFixed(2)}</span>
                        <div className="w-0.5 h-4 bg-blue-500 absolute -bottom-4"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 absolute -bottom-5"></div>
                      </div>

                      {/* Trailing Stop */}
                      {currentStop > minP && (
                        <div className="absolute flex flex-col items-center" style={{ right: `${trailingStopPercent}%`, transform: 'translateX(50%)', top: '100%', marginTop: '14px' }}>
                          <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900 absolute -top-5"></div>
                          <div className="w-0.5 h-4 bg-orange-500 absolute -top-4"></div>
                          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">وقف متحرك</span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{currentStop.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Current Price */}
                      <div className="absolute flex flex-col items-center" style={{ right: `${currentPercent}%`, transform: 'translateX(50%)', top: '100%', marginTop: '14px' }}>
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 dark:bg-white border-2 border-white dark:border-slate-900 absolute -top-5"></div>
                          <div className="w-0.5 h-4 bg-slate-800 dark:bg-white absolute -top-4"></div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">السوق</span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{metrics!.currentPrice.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })() : (
                  <div className="text-center w-full text-[10px] text-slate-500 font-bold mt-8">الخطة غير مكتملة (يرجى إضافة هدف ووقف)</div>
                )}
              </div>
            </div>

            {/* Trailing Stop Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400 font-bold text-xs">
                  <ArrowDownToLine className="w-4 h-4" />
                  الوقف المبدئي
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono-num" dir="ltr">
                  {(position!.trailingStop?.initial || position!.plan?.stop || 0).toFixed(2)}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-100 dark:border-red-900/60 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 rounded-r-2xl"></div>
                <div className="flex items-center justify-center gap-1.5 mb-1 text-red-600 dark:text-red-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  الوقف المتحرك الحالي
                </div>
                {isEditingStop ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <input type="number" step="any" value={manualStopInput} onChange={e => setManualStopInput(e.target.value)} className="w-20 text-center px-2 py-1 rounded bg-white dark:bg-slate-900 border text-red-600 dark:text-red-400 font-black text-sm" dir="ltr" autoFocus placeholder={currentStop.toFixed(2)} />
                    <button onClick={handleManualStopUpdate} className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold">حفظ</button>
                    <button onClick={() => setIsEditingStop(false)} className="text-[10px] bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold">إلغاء</button>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono-num flex items-center justify-center gap-2" dir="ltr">
                    {currentStop.toFixed(2)}
                    <button onClick={() => setIsEditingStop(true)} className="text-[10px] text-red-500 hover:text-red-700 underline" title="تعديل يدوي للوقف (تراجع عن خطأ)">تعديل</button>
                  </div>
                )}
              </div>
            </div>

            
</div>

          
            {/* Core / Satellite Advanced Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">توزيع التمركز (Core vs Satellite)</span>
                </div>
                {isEditingCoreShares ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-black px-2 py-1 outline-none text-center shadow-inner"
                      value={coreSharesInput}
                      onChange={e => setCoreSharesInput(e.target.value)}
                      autoFocus
                      dir="ltr"
                    />
                    <button onClick={handleSaveCoreShares} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"><CheckCircle className="w-4 h-4"/></button>
                    <button onClick={() => setIsEditingCoreShares(false)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingCoreShares(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <Pencil className="w-3 h-3" />
                    تعديل الكور
                  </button>
                )}
              </div>
              
              {/* Progress Bar Split */}
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden shadow-inner mt-4 mb-2 relative">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-center relative overflow-hidden"
                  style={{ width: `${position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0}%` }}
                  title="أسهم الكور (Core)"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                </div>
                <div 
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${100 - (position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0)}%` }}
                  title="أسهم الساتلايت (Satellite)"
                />
              </div>
              
              <div className="flex justify-between items-center text-xs font-black">
                <div className="text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  الكور: {position?.coreShares || 0} سهم 
                  <span className="opacity-60">({((position?.coreShares || 0) / metrics!.openShares * 100).toFixed(0)}%)</span>
                </div>
                <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  الساتلايت: {metrics!.openShares - (position?.coreShares || 0)} سهم
                  <span className="opacity-60">({(100 - ((position?.coreShares || 0) / metrics!.openShares * 100)).toFixed(0)}%)</span>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                </div>
              </div>
            </div>

          {/* Quick Partial Transactions Row */}
          {metrics!.isOpen && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTxModalType('buy')}
                className="flex-1 py-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                شراء إضافي (تمركز)
              </button>
              <button
                onClick={() => setTxModalType('sell')}
                className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-black rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                بيع جزئي (جني ربح)
              </button>
            </div>
          )}

          {/* Close Position (Full Exit) Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {metrics!.isOpen && (
              <button 
                onClick={() => setTxModalType('sellAll')}
                className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
              >
                <CheckCircle className="w-4 h-4" />
                إغلاق وتصفية كامل المركز المالي
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Partial Transaction Modal */}
      <TransactionFormModal
        isOpen={!!txModalType}
        onClose={() => setTxModalType(null)}
        position={position}
        defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}
        defaultShares={txModalType === 'sellAll' ? metrics!.openShares.toString() : ''}
      />
    
      <ConfirmModal
        isOpen={!!confirmTxId}
        title="حذف المعاملة"
        message="هل أنت متأكد من حذف هذه المعاملة بشكل نهائي؟ سيتم إعادة حساب متوسطات السهم."
        type="danger"
        confirmText="حذف"
        onConfirm={() => {
          if (confirmTxId) {
            deleteTransaction(position!.id, confirmTxId);
            setConfirmTxId(null);
          }
        }}
        onCancel={() => setConfirmTxId(null)}
      />

    </div>
  );
}