import { useState } from 'react';
import { Plus, Target, Clock, ArrowRight, Image as ImageIcon, LayoutGrid, CheckSquare, Maximize2, X, Save } from 'lucide-react';
import PlanEditor from './PlanEditor';

interface Plan {
  id: string;
  symbol: string;
  strategy: string;
  entry: number;
  target: number;
  stop: number;
  status: 'waiting' | 'ready';
  notes: string; // HTML content from PlanEditor
}

export default function Watchlist({ onMoveToJournal }: { onMoveToJournal: (item: any) => void }) {
  const [plans, setPlans] = useState<Plan[]>([
    { id: '1', symbol: 'COMI', strategy: 'اختراق مقاومة', entry: 75.00, target: 82.00, stop: 72.00, status: 'ready', notes: '<p>انتظار إغلاق شمعة ساعة فوق 75 للتأكيد...</p>' },
    { id: '2', symbol: 'FAIT', strategy: 'ارتداد من دعم', entry: 1.50, target: 1.80, stop: 1.40, status: 'waiting', notes: '<p>السهم عند منطقة طلب قوية جداً على اليومي.</p>' }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculateRRR = (entry: number, target: number, stop: number) => {
    if (!entry || !target || !stop || entry <= stop) return 0;
    const risk = entry - stop;
    const reward = target - entry;
    return (reward / risk).toFixed(1);
  };

  const columns = [
    { id: 'waiting', label: 'قيد المتابعة (Setup)', color: 'slate' },
    { id: 'ready', label: 'جاهز للتنفيذ (Trigger)', color: 'blue' },
  ];

  const handleSavePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setIsModalOpen(false);
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            مختبر الصفقات (Trading Lab)
          </h2>
          <p className="font-handwriting text-slate-500 text-lg mt-1">📌 خطط لصفقتك بهدوء، ونفذها كالقناص...</p>
        </div>
        <button 
          onClick={() => {
            setSelectedPlan({ id: Date.now().toString(), symbol: '', strategy: '', entry: 0, target: 0, stop: 0, status: 'waiting', notes: '' });
            setIsModalOpen(true);
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          خطة جديدة
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {columns.map(col => (
          <div key={col.id} className={`bg-${col.color}-50/30 backdrop-blur-sm border border-${col.color}-200/50 rounded-3xl p-5 min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className={`font-black text-${col.color}-800 flex items-center gap-2`}>
                {col.id === 'waiting' ? <Clock className="w-5 h-5 text-slate-500" /> : <Target className="w-5 h-5 text-blue-500" />}
                {col.label}
              </h3>
              <span className={`bg-${col.color}-100 text-${col.color}-700 text-sm font-black px-3 py-1 rounded-xl`}>
                {plans.filter(item => item.status === col.id).length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {plans.filter(item => item.status === col.id).map(item => {
                const rrr = calculateRRR(item.entry, item.target, item.stop);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => { setSelectedPlan(item); setIsModalOpen(true); }}
                    className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-[180px]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-slate-900 text-white font-black px-2.5 py-1 rounded-lg text-sm shadow-sm" dir="ltr">{item.symbol}</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100">
                        RR {rrr}
                      </span>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mb-auto line-clamp-1">
                      {item.strategy || 'بدون استراتيجية'}
                    </div>

                    <div className="mt-3 flex justify-between text-[11px] font-black text-slate-500 bg-slate-50 p-2 rounded-xl">
                      <div className="flex flex-col"><span className="text-slate-400 mb-0.5">دخول</span><span className="text-blue-600">{item.entry}</span></div>
                      <div className="flex flex-col"><span className="text-slate-400 mb-0.5">هدف</span><span className="text-emerald-600">{item.target}</span></div>
                      <div className="flex flex-col"><span className="text-slate-400 mb-0.5">وقف</span><span className="text-red-600">{item.stop}</span></div>
                    </div>

                    {col.id === 'ready' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onMoveToJournal(item); }}
                        className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        تنفيذ <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Plan Details Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl relative z-10 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-blue-600" />
                محرر الخطة
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              
              {/* Left Column: Rich Text Editor */}
              <div className="flex-1 space-y-3">
                <label className="text-sm font-bold text-slate-500 block">ملاحظات وشارتات الخطة (اسحب أو الصق الصور هنا)</label>
                <PlanEditor 
                  content={selectedPlan.notes} 
                  onChange={(val) => setSelectedPlan({...selectedPlan, notes: val})} 
                />
              </div>

              {/* Right Column: Parameters */}
              <div className="w-full md:w-[320px] space-y-5 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">الرمز (Symbol)</label>
                  <input type="text" value={selectedPlan.symbol} onChange={(e) => setSelectedPlan({...selectedPlan, symbol: e.target.value.toUpperCase()})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-black text-slate-800 focus:border-blue-500 outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">الاستراتيجية / سبب الدخول</label>
                  <input type="text" value={selectedPlan.strategy} onChange={(e) => setSelectedPlan({...selectedPlan, strategy: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:border-blue-500 outline-none" placeholder="مثال: تبادل أدوار..." />
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">الدخول المستهدف</label>
                    <input type="number" value={selectedPlan.entry || ''} onChange={(e) => setSelectedPlan({...selectedPlan, entry: parseFloat(e.target.value)})} className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 font-black text-blue-700 outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">الهدف (Target)</label>
                    <input type="number" value={selectedPlan.target || ''} onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value)})} className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 font-black text-emerald-700 outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">الوقف (Stop)</label>
                    <input type="number" value={selectedPlan.stop || ''} onChange={(e) => setSelectedPlan({...selectedPlan, stop: parseFloat(e.target.value)})} className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 font-black text-red-700 outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">نسبة RR</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-black text-slate-500 flex items-center h-[42px]" dir="ltr">
                      {calculateRRR(selectedPlan.entry, selectedPlan.target, selectedPlan.stop)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-400 block mb-2">حالة الخطة</label>
                  <select 
                    value={selectedPlan.status} 
                    onChange={(e) => setSelectedPlan({...selectedPlan, status: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none"
                  >
                    <option value="waiting">⏳ قيد المتابعة (لم تكتمل الشروط)</option>
                    <option value="ready">🎯 جاهزة للتنفيذ (اكتملت الشروط)</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button 
                onClick={() => handleSavePlan(selectedPlan)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ الخطة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
