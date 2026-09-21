import { Image as ImageIcon, CheckCircle2, Save, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTrades } from '../context/TradeContext';

export default function NewTradeForm({ initialData, onClose }: { initialData?: any, onClose?: () => void }) {
  const { addTrade, updateTrade } = useTrades();
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [makerPlan, setMakerPlan] = useState(initialData?.makerPlan || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [entryPrice, setEntryPrice] = useState<string>(initialData?.entryPrice?.toString() || '');
  const [targetPrice, setTargetPrice] = useState<string>(initialData?.targetPrice?.toString() || '');
  const [stopLoss, setStopLoss] = useState<string>(initialData?.initialStopLoss?.toString() || '');
  
  useEffect(() => {
    if (initialData?.symbol) setSymbol(initialData.symbol);
    if (initialData?.entryPrice) setEntryPrice(initialData.entryPrice.toString());
    if (initialData?.targetPrice) setTargetPrice(initialData.targetPrice.toString());
    if (initialData?.initialStopLoss) setStopLoss(initialData.initialStopLoss.toString());
    if (initialData?.makerPlan) setMakerPlan(initialData.makerPlan);
  }, [initialData]);
  
  const [checklist, setChecklist] = useState({
    majorSR: initialData?.checklist?.majorSR || false,
    bos: initialData?.checklist?.bos || false,
    retest: initialData?.checklist?.retest || false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) setImages(prev => [...prev, URL.createObjectURL(blob!)]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setImages(prev => [...prev, URL.createObjectURL(e.dataTransfer.files[0])]);
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const allChecked = checklist.majorSR && checklist.bos && checklist.retest;

  const handleSave = () => {
    if (!symbol) return;
    const entry = parseFloat(entryPrice) || 0;
    const target = parseFloat(targetPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const atr15 = initialData?.atr15 || initialData?.atrAtEntry || 0;
    
    const tradeData = {
      symbol, portfolioType: initialData?.portfolioType || 'investment',
      status: initialData?.status || 'open', entryPrice: entry, atrAtEntry: atr15,
      initialStopLoss: sl, currentStopLoss: initialData?.currentStopLoss || sl,
      highestPrice: initialData?.highestPrice || entry,
      targetPrice: target,
      shares: initialData?.sharesCount || initialData?.shares || 0,
      makerPlan, checklist, images, isRuleBreaker: !allChecked,
    };

    if (initialData?.id) updateTrade(initialData.id, tradeData);
    else addTrade(tradeData);
    onClose?.();
  };

  const checkItems = [
    { key: 'majorSR', emoji: '📍', label: 'السعر عند دعم/مقاومة رئيسية', sublabel: 'Major S/R' },
    { key: 'bos', emoji: '💥', label: 'كسر هيكل الاتجاه', sublabel: 'Break of Structure' },
    { key: 'retest', emoji: '🎯', label: 'إعادة الاختبار بنجاح', sublabel: 'Successful Retest' },
  ];

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">
      
      {/* General Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">رمز السهم (Ticker)</label>
          <input 
            type="text" 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full text-2xl font-black text-slate-800 py-3 px-4 border-b-2 border-slate-300 bg-transparent focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="COMI"
            dir="ltr"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">سلوك المزاد / خطة الميكر</label>
          <input 
            type="text" 
            value={makerPlan}
            onChange={(e) => setMakerPlan(e.target.value)}
            className="w-full text-base font-bold text-slate-700 py-3 px-4 border-b-2 border-slate-300 bg-transparent focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="ما هي نية صانع السوق؟"
          />
        </div>
      </div>

      {/* Financial Parameters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block text-center">سعر الدخول</label>
          <input 
            type="number" 
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full text-lg font-black text-blue-700 py-2.5 px-3 border border-blue-200 bg-blue-50 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block text-center">الهدف (Target)</label>
          <input 
            type="number" 
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full text-lg font-black text-emerald-700 py-2.5 px-3 border border-emerald-200 bg-emerald-50 rounded-xl focus:border-emerald-500 focus:outline-none text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block text-center">الوقف (Stop)</label>
          <input 
            type="number" 
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full text-lg font-black text-red-700 py-2.5 px-3 border border-red-200 bg-red-50 rounded-xl focus:border-red-500 focus:outline-none text-center"
            dir="ltr"
          />
        </div>
      </div>

      {/* Divider with handwriting label */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="font-handwriting text-sm text-slate-400">شروط الدخول الإلزامية</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* 3MS Checklist — clean underline style */}
      <div className="space-y-3">
        {checkItems.map(({ key, emoji, label, sublabel }) => {
          const checked = checklist[key as keyof typeof checklist];
          return (
            <label key={key} className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
              checked 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}>
              <input 
                type="checkbox" 
                checked={checked}
                onChange={(e) => setChecklist({...checklist, [key]: e.target.checked})}
                className="w-5 h-5 text-emerald-600 rounded-md border-slate-300"
              />
              <span className="text-lg">{emoji}</span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${checked ? 'text-emerald-800' : 'text-slate-700'}`}>{label}</p>
                <p className="font-handwriting text-xs text-slate-400">{sublabel}</p>
              </div>
              {checked && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            </label>
          );
        })}
      </div>

      {/* Images Upload */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
          صور الشارت (دليل الإعداد)
        </label>
        
        <div 
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 bg-white/40 rounded-2xl p-5 text-center hover:bg-white/70 hover:border-blue-400 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple
            onChange={(e) => {
              if (e.target.files)
                setImages(prev => [...prev, ...Array.from(e.target.files!).map(f => URL.createObjectURL(f))]);
            }}
          />
          <ImageIcon className="w-7 h-7 mx-auto text-slate-300 group-hover:text-blue-400 transition-colors mb-2" />
          <p className="text-sm font-bold text-slate-500">اضغط لاختيار صور، أو اسحب وافلت</p>
          <p className="font-handwriting text-xs text-slate-400 mt-0.5">أو الصق بـ Ctrl+V مباشرة</p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                <img src={img} alt="Chart" className="w-full h-full object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-1">
        <button 
          disabled={!symbol}
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all ${
            !symbol
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : allChecked 
                ? 'bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-md shadow-blue-400/20 hover:-translate-y-0.5 hover:shadow-lg'
                : 'bg-gradient-to-l from-amber-500 to-amber-400 text-white shadow-md shadow-amber-400/20 hover:-translate-y-0.5'
          }`}
        >
          <Save className="w-4 h-4" />
          {initialData?.id ? 'حفظ التعديلات' : allChecked ? 'حفظ الصفقة في الجورنال ✓' : 'تسجيل كصفقة استثنائية ⚠️'}
        </button>
        {(!allChecked && symbol) && (
          <div className="mt-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <p className="font-handwriting text-sm text-amber-700 text-center">
              ⚠️ شروط 3MS غير مكتملة — ستُحفظ كصفقة استثنائية للمراقبة والتعلم
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
