import { useState } from 'react';
import { Plus, Target, Clock, ArrowRight, LayoutGrid, CheckSquare, X, Save, Search, LineChart, FileText } from 'lucide-react';
import PlanEditor from './PlanEditor';

interface Plan {
  id: string;
  symbol: string;
  strategy: string;
  entry: number;
  target: number;
  stop: number;
  status: 'waiting' | 'ready';
  notes: string; // HTML content
}

export default function Watchlist({ onMoveToJournal }: { onMoveToJournal: (item: any) => void }) {
  const [plans, setPlans] = useState<Plan[]>([
    { id: '1', symbol: 'COMI', strategy: 'اختراق مقاومة', entry: 75.00, target: 82.00, stop: 72.00, status: 'ready', notes: '<p>انتظار إغلاق شمعة ساعة فوق 75 للتأكيد...</p>' },
    { id: '2', symbol: 'FAIT', strategy: 'ارتداد من دعم', entry: 1.50, target: 1.80, stop: 1.40, status: 'waiting', notes: '<p>السهم عند منطقة طلب قوية جداً على اليومي.</p>' }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const calculateRRR = (entry: number, target: number, stop: number) => {
    if (!entry || !target || !stop || entry <= stop) return 0;
    const risk = entry - stop;
    const reward = target - entry;
    return (reward / risk).toFixed(1);
  };

  const handleSavePlan = (updatedPlan: Plan) => {
    setPlans(prev => {
      const exists = prev.find(p => p.id === updatedPlan.id);
      if (exists) return prev.map(p => p.id === updatedPlan.id ? updatedPlan : p);
      return [updatedPlan, ...prev];
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const filteredPlans = plans.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.strategy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header & Controls */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
              مختبر الصفقات (Trading Lab)
            </h2>
            <p className="font-handwriting text-slate-500 text-lg mt-1">📌 خطط لصفقتك بهدوء كالمحترف، ونفذها كالقناص...</p>
          </div>
          
          <button 
            onClick={() => {
              setSelectedPlan({ id: Date.now().toString(), symbol: '', strategy: '', entry: 0, target: 0, stop: 0, status: 'waiting', notes: '' });
              setIsModalOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-1 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            إضافة خطة جديدة
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200/50">
          
          {/* Subtabs */}
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              كل الخطط
            </button>
            <button 
              onClick={() => setActiveTab('waiting')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'waiting' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Clock className="w-4 h-4 text-slate-400" /> قيد المتابعة
            </button>
            <button 
              onClick={() => setActiveTab('ready')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'ready' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Target className="w-4 h-4 text-blue-500" /> جاهز للتنفيذ
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث بالرمز أو الاستراتيجية..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPlans.map(item => {
          const rrr = calculateRRR(item.entry, item.target, item.stop);
          const isReady = item.status === 'ready';
          
          return (
            <div 
              key={item.id} 
              className={`bg-white/90 backdrop-blur-md border-2 rounded-[2rem] p-5 shadow-sm hover:shadow-xl transition-all flex flex-col relative group ${isReady ? 'border-blue-200 hover:border-blue-400' : 'border-slate-100 hover:border-slate-300'}`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-slate-800" dir="ltr">{item.symbol || '---'}</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md w-fit line-clamp-1">
                    {item.strategy || 'بدون استراتيجية'}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border ${isReady ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {isReady ? <Target className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isReady ? 'جاهز' : 'متابعة'}
                  </span>
                </div>
              </div>

              {/* RRR Badge */}
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-black">
                  العائد للمخاطرة <span>(RR {rrr})</span>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-2 mb-5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">دخول</span>
                  <span className="text-sm font-black text-blue-600" dir="ltr">{item.entry}</span>
                </div>
                <div className="flex flex-col border-r border-l border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">هدف</span>
                  <span className="text-sm font-black text-emerald-600" dir="ltr">{item.target}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">وقف</span>
                  <span className="text-sm font-black text-red-600" dir="ltr">{item.stop}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-2">
                <button 
                  onClick={() => { setSelectedPlan(item); setIsModalOpen(true); }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  عرض وتعديل التفاصيل
                </button>
                
                {isReady && (
                  <button 
                    onClick={() => { 
                      onMoveToJournal(item);
                      // Optionally remove from plans automatically: handleDelete(item.id);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    تحويل لصفقة فعلية 
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredPlans.length === 0 && (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/30">
            <Target className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-slate-600">لا توجد خطط هنا</h3>
            <p className="text-slate-400 font-bold mt-1 text-sm">أضف خطة جديدة لتبدأ المراقبة والقنص!</p>
          </div>
        )}
      </div>

      {/* Plan Details Modal (Unchanged Layout from previous fix) */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl relative z-10 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-blue-600" />
                محرر الخطة
              </h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
                    handleDelete(selectedPlan.id);
                    setIsModalOpen(false);
                  }
                }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-lg transition-colors">
                  حذف الخطة
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Right Column (in RTL): Parameters */}
              <div className="w-full lg:w-[340px] space-y-5 bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col shrink-0">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-xs font-bold text-slate-400 block">الرمز (Symbol)</label>
                    {selectedPlan.symbol && (
                      <a 
                        href={`https://www.tradingview.com/chart/?symbol=EGX:${selectedPlan.symbol}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <LineChart className="w-3 h-3" />
                        فتح الشارت
                      </a>
                    )}
                  </div>
                  <input type="text" value={selectedPlan.symbol} onChange={(e) => setSelectedPlan({...selectedPlan, symbol: e.target.value.toUpperCase()})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-black text-slate-800 focus:border-blue-500 outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">الاستراتيجية / سبب الدخول</label>
                  <input type="text" value={selectedPlan.strategy} onChange={(e) => setSelectedPlan({...selectedPlan, strategy: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:border-blue-500 outline-none" placeholder="مثال: تبادل أدوار..." />
                </div>
                
                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100">
                    <label className="text-sm font-bold text-slate-500">سعر الدخول</label>
                    <input type="number" value={selectedPlan.entry || ''} onChange={(e) => setSelectedPlan({...selectedPlan, entry: parseFloat(e.target.value)})} className="w-24 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 font-black text-blue-700 outline-none text-center" dir="ltr" />
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100">
                    <label className="text-sm font-bold text-slate-500">الهدف (Target)</label>
                    <input type="number" value={selectedPlan.target || ''} onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value)})} className="w-24 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5 font-black text-emerald-700 outline-none text-center" dir="ltr" />
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                    <label className="text-sm font-bold text-slate-500">الوقف (Stop)</label>
                    <input type="number" value={selectedPlan.stop || ''} onChange={(e) => setSelectedPlan({...selectedPlan, stop: parseFloat(e.target.value)})} className="w-24 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 font-black text-red-700 outline-none text-center" dir="ltr" />
                  </div>
                  <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl border border-slate-200 mt-2">
                    <label className="text-sm font-black text-slate-600">نسبة المخاطرة للعائد (RRR)</label>
                    <span className="font-black text-lg text-slate-800" dir="ltr">{calculateRRR(selectedPlan.entry, selectedPlan.target, selectedPlan.stop)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-400 block mb-2">حالة الخطة</label>
                  <select 
                    value={selectedPlan.status} 
                    onChange={(e) => setSelectedPlan({...selectedPlan, status: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none"
                  >
                    <option value="waiting">⏳ قيد المتابعة (Setup)</option>
                    <option value="ready">🎯 جاهزة للتنفيذ (Trigger)</option>
                  </select>
                </div>
              </div>

              {/* Left Column (in RTL): Rich Text Editor */}
              <div className="flex-1 flex flex-col space-y-3 min-h-[400px]">
                <label className="text-sm font-bold text-slate-500 block">ملاحظات وشارتات الخطة (اسحب أو الصق الصور هنا)</label>
                <div className="flex-1">
                  <PlanEditor 
                    content={selectedPlan.notes} 
                    onChange={(val) => setSelectedPlan({...selectedPlan, notes: val})} 
                  />
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
