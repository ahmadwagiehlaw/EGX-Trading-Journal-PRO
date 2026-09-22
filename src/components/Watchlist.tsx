import { useState } from 'react';
import { Plus, Target, Clock, ArrowRight, CheckSquare, X, Save, Search, LineChart, FileText, Trash2, ArrowUpDown } from 'lucide-react';
import PlanUpdatesFeed from './PlanUpdatesFeed';
import StockAutocomplete from './StockAutocomplete';
import { useTrades, type Plan } from '../context/TradeContext';

export default function Watchlist({ onMoveToJournal }: { onMoveToJournal: (item: any) => void }) {
  const { plans, addPlan, updatePlan, deletePlan, convertPlanToPosition } = useTrades();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Range helper
  const getEntryRange = (plan: Plan) => {
    const min = plan.entryZone?.min ?? plan.entry ?? 0;
    const max = plan.entryZone?.max ?? plan.entry ?? min;
    return { min, max };
  };

  const calculateRRR = (plan: Plan) => {
    const { min, max } = getEntryRange(plan);
    const avgEntry = (min + max) / 2 || min;
    const { target, stop } = plan;
    
    if (!avgEntry || !target || !stop || avgEntry <= stop) return '0.0';
    const risk = avgEntry - stop;
    const reward = target - avgEntry;
    return (reward / risk).toFixed(1);
  };

  const handleSavePlan = (updatedPlan: Plan) => {
    if (!updatedPlan.symbol) return;

    // Ensure entryZone is well formed
    const min = Number(updatedPlan.entryZone?.min) || 0;
    const max = Number(updatedPlan.entryZone?.max) || min;

    const normalizedPlan: Plan = {
      ...updatedPlan,
      symbol: updatedPlan.symbol.toUpperCase(),
      entryZone: { min, max },
      entry: min, // backward compatibility
    };

    const exists = plans.find(p => p.id === normalizedPlan.id);
    if (exists) {
      updatePlan(normalizedPlan.id, normalizedPlan);
    } else {
      addPlan(normalizedPlan);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deletePlan(id);
    setDeleteConfirmId(null);
    if (selectedPlan?.id === id) {
      setIsModalOpen(false);
    }
  };

  const handleConvertToTrade = async (plan: Plan) => {
    try {
      const { min } = getEntryRange(plan);
      const defaultPrice = min > 0 ? min : 0;
      await convertPlanToPosition(plan, defaultPrice, 100);
      onMoveToJournal(plan);
    } catch (err) {
      console.error("Error converting plan to position:", err);
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = 
      (p.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.strategy || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          
          {/* Subtabs */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              كل الخطط ({plans.length})
            </button>
            <button 
              onClick={() => setActiveTab('waiting')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'waiting' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-400" />
              قيد المتابعة ({plans.filter(p => p.status === 'waiting').length})
            </button>
            <button 
              onClick={() => setActiveTab('ready')}
              className={`flex-1 md:px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ready' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 text-blue-500" />
              جاهز للتنفيذ ({plans.filter(p => p.status === 'ready').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="ابحث بالرمز أو الاستراتيجية..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none shadow-sm transition-all"
            />
          </div>
        </div>
        
        <button 
          onClick={() => {
            setSelectedPlan({ 
              id: Date.now().toString(), 
              symbol: '', 
              strategy: '', 
              entryZone: { min: 0, max: 0 }, 
              target: 0, 
              stop: 0, 
              status: 'waiting', 
              updates: [] 
            });
            setIsModalOpen(true);
          }}
          className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 w-full md:w-auto shrink-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة خطة جديدة
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPlans.map(item => {
          const rrr = calculateRRR(item);
          const isReady = item.status === 'ready';
          const { min: entryMin, max: entryMax } = getEntryRange(item);
          
          return (
            <div 
              key={item.id} 
              className={`bg-white dark:bg-slate-900 backdrop-blur-md border rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col relative group ${
                isReady 
                  ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-950 shadow-blue-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{item.symbol || '---'}</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md w-fit line-clamp-1">
                    {item.strategy || 'بدون استراتيجية'}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border ${
                    isReady 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {isReady ? <Target className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isReady ? 'جاهز للتنفيذ' : 'قيد المتابعة'}
                  </span>
                  <span className="text-[10px] font-mono-num font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                    RR {rrr}
                  </span>
                </div>
              </div>

              {/* Entry Zone Display (Range Bar) */}
              <div className="my-3 p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-blue-500" />
                    نطاق الدخول (Range):
                  </span>
                  <span className="font-black text-blue-700 dark:text-blue-400 font-mono-num" dir="ltr">
                    {entryMin === entryMax || entryMax === 0 
                      ? `${entryMin.toFixed(2)} EGP`
                      : `${entryMin.toFixed(2)} — ${entryMax.toFixed(2)} EGP`
                    }
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-center text-xs">
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">الهدف</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300" dir="ltr">{item.target?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-red-50/70 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-100 dark:border-red-900/60">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block">الوقف</span>
                    <span className="font-black text-red-700 dark:text-red-300" dir="ltr">{item.stop?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Updates Badge if any */}
              {item.updates && item.updates.length > 0 && (
                <div className="mb-3 text-[11px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {item.updates.length} تحديث مسجل
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-2 pt-1">
                <button 
                  onClick={() => { setSelectedPlan(item); setIsModalOpen(true); }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  عرض وتعديل التفاصيل
                </button>
                
                {isReady && (
                  <button 
                    onClick={() => handleConvertToTrade(item)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    تحويل لصفقة فعلية (تمركز)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredPlans.length === 0 && (
          <div className="col-span-full py-16 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">لا توجد خطط تطابق البحث</h3>
            <p className="text-slate-400 dark:text-slate-500 font-bold mt-1 text-sm">أضف خطة جديدة لتبدأ المتابعة وتوثيق أهدافك بدقة!</p>
          </div>
        )}
      </div>

      {/* Plan Details Modal with Range inputs & Live RRR */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                محرر الخطة والتمركز الذكي
              </h2>
              
              <div className="flex items-center gap-2">
                {deleteConfirmId === selectedPlan.id ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/60 p-1.5 rounded-xl border border-red-200 dark:border-red-800">
                    <span className="text-xs font-bold text-red-700 dark:text-red-300">هل أنت متأكد؟</span>
                    <button
                      onClick={() => handleDelete(selectedPlan.id)}
                      className="px-2.5 py-1 bg-red-600 text-white text-xs font-black rounded-lg hover:bg-red-700"
                    >
                      نعم، احذف
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 text-slate-500 dark:text-slate-400 text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setDeleteConfirmId(selectedPlan.id)} 
                    className="p-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                    title="حذف الخطة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Right Column: Parameters & Entry Range */}
              <div className="w-full lg:w-[360px] space-y-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/60 flex flex-col shrink-0">
                
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">السهم (ابحث بالاسم أو الرمز)</label>
                    {selectedPlan.symbol && (
                      <a 
                        href={`https://www.tradingview.com/chart/?symbol=EGX:${selectedPlan.symbol}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <LineChart className="w-3 h-3" />
                        فتح الشارت
                      </a>
                    )}
                  </div>
                  <StockAutocomplete
                    value={selectedPlan.symbol}
                    onChange={(sym) => setSelectedPlan({...selectedPlan, symbol: sym})}
                    placeholder="COMI أو التجاري الدولي..."
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1.5">الاستراتيجية / سبب الدخول</label>
                  <input 
                    type="text" 
                    value={selectedPlan.strategy} 
                    onChange={(e) => setSelectedPlan({...selectedPlan, strategy: e.target.value})} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" 
                    placeholder="مثال: اختراق مع فوليوم عالي وإعادة اختبار" 
                  />
                </div>
                
                {/* Entry Zone Inputs (Min & Max Range) */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/60 space-y-2">
                  <label className="text-xs font-black text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    نطاق سعر الدخول المرجح (Entry Range)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الحد الأدنى (Min)</span>
                      <input 
                        type="number" 
                        step="any"
                        value={selectedPlan.entryZone?.min || ''} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setSelectedPlan({
                            ...selectedPlan, 
                            entryZone: { min: val, max: selectedPlan.entryZone?.max || val }
                          });
                        }} 
                        className="w-full bg-blue-50/60 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-blue-800 dark:text-blue-300 outline-none text-center" 
                        dir="ltr"
                        placeholder="44.50"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الحد الأقصى (Max)</span>
                      <input 
                        type="number" 
                        step="any"
                        value={selectedPlan.entryZone?.max || ''} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setSelectedPlan({
                            ...selectedPlan, 
                            entryZone: { min: selectedPlan.entryZone?.min || val, max: val }
                          });
                        }} 
                        className="w-full bg-blue-50/60 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-blue-800 dark:text-blue-300 outline-none text-center" 
                        dir="ltr"
                        placeholder="46.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Target and Stop Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الهدف (Target)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={selectedPlan.target || ''} 
                      onChange={(e) => setSelectedPlan({...selectedPlan, target: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-emerald-700 dark:text-emerald-400 outline-none text-center" 
                      dir="ltr" 
                      placeholder="52.00"
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-red-100 dark:border-red-900/60">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الوقف (Stop)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={selectedPlan.stop || ''} 
                      onChange={(e) => setSelectedPlan({...selectedPlan, stop: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-black text-red-700 dark:text-red-400 outline-none text-center" 
                      dir="ltr" 
                      placeholder="42.50"
                    />
                  </div>
                </div>

                {/* Live RRR Badge */}
                <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-300">نسبة المخاطرة للعائد (RRR)</label>
                  <span className="font-black text-lg text-slate-900 dark:text-white font-mono-num" dir="ltr">
                    1 : {calculateRRR(selectedPlan)}
                  </span>
                </div>

                {/* Status Selection */}
                <div className="pt-2 mt-auto border-t border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1.5">حالة الخطة</label>
                  <select 
                    value={selectedPlan.status} 
                    onChange={(e) => setSelectedPlan({...selectedPlan, status: e.target.value as any})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white outline-none text-sm"
                  >
                    <option value="waiting">⏳ قيد المتابعة والتجهيز (Setup)</option>
                    <option value="ready">🎯 جاهزة للتنفيذ فوراً (Trigger)</option>
                  </select>
                </div>
              </div>

              {/* Left Column: Updates Feed */}
              <div className="flex-1 flex flex-col min-h-[400px]">
                <PlanUpdatesFeed 
                  updates={selectedPlan.updates || []} 
                  onChange={(updates) => setSelectedPlan({...selectedPlan, updates})}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
              >
                إلغاء
              </button>
              <button 
                onClick={() => handleSavePlan(selectedPlan)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                حفظ الخطة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
