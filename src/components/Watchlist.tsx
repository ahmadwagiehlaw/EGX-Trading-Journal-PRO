import { useState } from 'react';
import { Plus, GripVertical, CheckCircle2, Clock, Trash2, Edit3, Target, ArrowRight } from 'lucide-react';
import { useTrades } from '../context/TradeContext';

export default function Watchlist({ onMoveToJournal }: { onMoveToJournal: (item: any) => void }) {
  // Temporary local state for watchlist. In a real app, this would be in TradeContext.
  const [watchlist, setWatchlist] = useState([
    { id: '1', symbol: 'FAIT', plan: 'شراء عند الارتداد من الدعم 1.50', status: 'waiting', target: 1.8, stopLoss: 1.4, is3MS: false },
    { id: '2', symbol: 'ISPH', plan: 'اختراق مقاومة 2.20 والثبات أعلاها', status: 'ready', target: 2.6, stopLoss: 2.1, is3MS: true },
  ]);

  const columns = [
    { id: 'waiting', label: 'قيد المتابعة', color: 'slate' },
    { id: 'ready', label: 'جاهز للدخول', color: 'blue' },
  ];

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">قائمة المراقبة والخطط</h2>
          <p className="font-handwriting text-slate-500 text-lg mt-1">📌 جهّز صفقاتك قبل الدخول...</p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" />
          إضافة خطة
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {columns.map(col => (
          <div key={col.id} className={`bg-${col.color}-50/50 border border-${col.color}-200/60 rounded-3xl p-5 min-h-[400px]`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className={`font-black text-${col.color}-700 flex items-center gap-2`}>
                {col.id === 'waiting' ? <Clock className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                {col.label}
              </h3>
              <span className={`bg-${col.color}-100 text-${col.color}-600 text-xs font-bold px-2.5 py-1 rounded-full`}>
                {watchlist.filter(item => item.status === col.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {watchlist.filter(item => item.status === col.id).map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                      <span className="font-black text-lg text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg" dir="ltr">{item.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <p className="font-bold text-slate-600 text-sm mb-3 px-6 leading-relaxed">
                    {item.plan}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 px-2 border-t border-slate-100 pt-3">
                    <div className="flex gap-3 text-xs font-bold">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">الهدف: {item.target}</span>
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">الوقف: {item.stopLoss}</span>
                    </div>
                    
                    {item.is3MS && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600" title="شروط 3MS متوفرة">
                        <CheckCircle2 className="w-4 h-4" />
                        3MS
                      </span>
                    )}
                  </div>

                  {/* Move to Journal Button */}
                  {col.id === 'ready' && (
                    <button 
                      onClick={() => onMoveToJournal(item)}
                      className="w-full mt-3 py-2 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-black rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      تنفيذ الصفقة الآن
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {watchlist.filter(item => item.status === col.id).length === 0 && (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white/50">
                  <p className="font-handwriting text-slate-400 text-lg">لا توجد خطط هنا...</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
