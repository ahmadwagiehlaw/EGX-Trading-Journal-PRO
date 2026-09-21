import { useState } from 'react';
import { Plus, Search, Filter, ShieldAlert, X, PenTool, LineChart } from 'lucide-react';
import NewTradeForm from './NewTradeForm';
import ActiveTrades from './ActiveTrades';
import { useTrades } from '../context/TradeContext';

function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-3xl' }: {
  isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string, maxWidth?: string
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-slate-200`}
        style={{ background: '#ffffff', backgroundImage: 'repeating-linear-gradient(transparent,transparent 31px,#e2e8f0 31px,#e2e8f0 32px)', backgroundSize: '100% 32px' }}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 px-7 py-5 flex items-center justify-between border-b border-slate-200"
          style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div>
            <h2 className="text-xl font-black text-slate-800">{title}</h2>
            <div className="w-24 h-0.5 bg-blue-400/30 mt-1.5 rounded-full"></div>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-7">{children}</div>
      </div>
    </div>
  );
}

export default function TradesJournal({ draftTrade, isNewTradeOpen, setIsNewTradeOpen }: {
  draftTrade: any, isNewTradeOpen: boolean, setIsNewTradeOpen: (v: boolean) => void
}) {
  const { trades, deleteTrade } = useTrades();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<any>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'won': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'lost': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '● نشطة';
      case 'won': return '✓ ربح';
      case 'lost': return '✕ خسارة';
      default: return '○ انتظار';
    }
  };

  return (
    <div className="w-full space-y-5" dir="rtl">
      
      {/* Handwriting header note */}
      <p className="font-handwriting text-lg text-slate-500 px-1">📋 سجل جميع صفقاتك هنا ↓</p>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 rounded-3xl border border-slate-200 shadow-sm"
        style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input 
              type="text" 
              placeholder="ابحث برمز السهم..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 pr-10 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={() => { setEditingTrade(null); setIsNewTradeOpen(true); }}
          className="w-full sm:w-auto bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md shadow-blue-400/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          تسجيل صفقة جديدة
        </button>
      </div>

      {/* Table */}
      <div className="rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.9)', borderBottom: '1px solid #e2e8f0' }}>
                {['الرمز', 'الحالة', 'سعر الدخول', 'الوقف الحالي', 'الهدف', 'الربح/الخسارة', 'إجراءات'].map(h => (
                  <th key={h} className="py-4 px-5 font-black text-slate-500 text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="font-handwriting text-2xl text-slate-400">لا توجد صفقات بعد...</p>
                    <p className="text-sm font-bold text-slate-400 mt-1">ابدأ بتسجيل أول صفقة من الزر أعلاه!</p>
                  </td>
                </tr>
              ) : trades.map((trade, idx) => (
                <tr 
                  key={trade.id} 
                  onClick={() => setSelectedTradeId(trade.id)}
                  className="cursor-pointer group transition-colors hover:bg-blue-50/40"
                  style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border transition-all group-hover:scale-105 ${
                        trade.isRuleBreaker 
                          ? 'bg-amber-100 border-amber-300 text-amber-700' 
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {trade.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-800" dir="ltr">{trade.symbol}</span>
                          {trade.isRuleBreaker && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" title="صفقة استثنائية" />}
                        </div>
                        <span className="font-handwriting text-xs text-slate-400">صفقة #{idx + 1}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusStyle(trade.status)}`}>
                      {getStatusText(trade.status)}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-700 text-sm" dir="ltr">{trade.entryPrice.toFixed(2)}</td>
                  <td className="py-4 px-5 font-bold text-slate-500 text-sm" dir="ltr">{trade.currentStopLoss.toFixed(2)}</td>
                  <td className="py-4 px-5 font-bold text-slate-500 text-sm" dir="ltr">{trade.targetPrice.toFixed(2)}</td>
                  <td className="py-4 px-5">
                    {trade.pnl !== undefined ? (
                      <span className={`font-black text-sm ${trade.pnl > 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                        {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(0)} EGP
                      </span>
                    ) : <span className="text-slate-300 font-bold">—</span>}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTradeId(trade.id); }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="فتح الشارت وتفاصيل الصفقة"
                      >
                        <LineChart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingTrade(trade); setIsNewTradeOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTrade(trade.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isNewTradeOpen} 
        onClose={() => { setIsNewTradeOpen(false); setEditingTrade(null); }} 
        title={editingTrade ? "✏️ تعديل بيانات الصفقة" : "📝 توثيق صفقة جديدة (3MS)"}
      >
        <NewTradeForm initialData={editingTrade || draftTrade} onClose={() => { setIsNewTradeOpen(false); setEditingTrade(null); }} />
      </Modal>

      <Modal 
        isOpen={!!selectedTradeId} 
        onClose={() => setSelectedTradeId(null)} 
        title="📊 تفاصيل الصفقة ومحرك الوقف المتحرك"
        maxWidth="max-w-[95vw] lg:max-w-[82vw]"
      >
        <ActiveTrades tradeId={selectedTradeId!} onClose={() => setSelectedTradeId(null)} />
      </Modal>
    </div>
  );
}
