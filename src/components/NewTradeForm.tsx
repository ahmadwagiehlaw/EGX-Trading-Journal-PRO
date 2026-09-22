import { Image as ImageIcon, CheckCircle2, Save, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTrades } from '../context/TradeContext';
import StockAutocomplete from './StockAutocomplete';

export default function NewTradeForm({ 
  initialData, 
  onClose 
}: { 
  initialData?: any; 
  onClose?: () => void;
}) {
  const { addPosition, updatePosition } = useTrades();

  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [makerPlan, setMakerPlan] = useState(initialData?.makerPlan || initialData?.plan?.strategy || '');
  const [images, setImages] = useState<string[]>(initialData?.images || initialData?.plan?.images || []);
  const [entryPrice, setEntryPrice] = useState<string>(
    initialData?.entryPrice?.toString() || 
    initialData?.plan?.entryZone?.min?.toString() || 
    ''
  );
  const [targetPrice, setTargetPrice] = useState<string>(
    initialData?.targetPrice?.toString() || 
    initialData?.plan?.target?.toString() || 
    ''
  );
  const [stopLoss, setStopLoss] = useState<string>(
    initialData?.initialStopLoss?.toString() || 
    initialData?.plan?.stop?.toString() || 
    ''
  );
  const [sharesCount, setSharesCount] = useState<string>(
    initialData?.shares?.toString() || 
    initialData?.sharesCount?.toString() || 
    '100'
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || initialData?.journal?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [checklist, setChecklist] = useState({
    majorSR: initialData?.checklist?.majorSR || initialData?.plan?.checklist?.majorSR || false,
    bos: initialData?.checklist?.bos || initialData?.plan?.checklist?.bos || false,
    retest: initialData?.checklist?.retest || initialData?.plan?.checklist?.retest || false,
  });

  useEffect(() => {
    if (initialData?.symbol) setSymbol(initialData.symbol);
    if (initialData?.entryPrice) setEntryPrice(initialData.entryPrice.toString());
    if (initialData?.targetPrice) setTargetPrice(initialData.targetPrice.toString());
    if (initialData?.initialStopLoss) setStopLoss(initialData.initialStopLoss.toString());
    if (initialData?.makerPlan) setMakerPlan(initialData.makerPlan);
  }, [initialData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) setImages(prev => [...prev, URL.createObjectURL(blob)]);
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

  const handleSave = async () => {
    if (!symbol.trim()) return;

    const entry = parseFloat(entryPrice) || 0;
    const target = parseFloat(targetPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const shares = parseInt(sharesCount, 10) || 100;
    const atr15 = initialData?.atr15 || initialData?.atrAtEntry || 0;
    const isRuleBreaker = !allChecked;

    if (initialData?.id) {
      // Editing existing position
      await updatePosition(initialData.id, {
        symbol: symbol.toUpperCase(),
        plan: {
          strategy: makerPlan,
          entryZone: { min: entry, max: entry },
          target,
          stop: sl,
          atr: atr15,
          checklist,
          images,
          makerPlan,
        },
        'journal.tags': tags,
        'journal.isRuleBreaker': isRuleBreaker,
      } as any);
    } else {
      // Create new TickerPosition with initial buy transaction
      const initialTx = {
        id: 'tx_init_' + Math.random().toString(36).substring(2, 8),
        type: 'buy' as const,
        date: Date.now(),
        price: entry,
        shares,
        amount: entry * shares,
        note: 'شراء أولي وتمركز',
      };

      await addPosition({
        symbol: symbol.toUpperCase(),
        portfolioType: initialData?.portfolioType || 'investment',
        status: 'active',
        plan: {
          strategy: makerPlan,
          entryZone: { min: entry, max: entry },
          target,
          stop: sl,
          atr: atr15,
          checklist,
          images,
          makerPlan,
        },
        transactions: entry > 0 ? [initialTx] : [],
        trailingStop: {
          initial: sl,
          current: sl,
          highestReached: entry,
          atrAtEntry: atr15,
        },
        journal: {
          openedDate: Date.now(),
          tags,
          isRuleBreaker,
          emotion: 'confident',
        },
      });
    }

    onClose?.();
  };

  const checkItems = [
    { key: 'majorSR', emoji: '📍', label: 'السعر عند دعم/مقاومة رئيسية', sublabel: 'Major S/R' },
    { key: 'bos', emoji: '💥', label: 'كسر هيكل الاتجاه وتغيير الطابع', sublabel: 'Break of Structure (BOS)' },
    { key: 'retest', emoji: '🎯', label: 'إعادة الاختبار وتأكيد البرايس أكشن', sublabel: 'Successful Retest' },
  ];

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">
      
      {/* General Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            السهم (ابحث بالاسم العربي أو الرمز)
          </label>
          <StockAutocomplete
            value={symbol}
            onChange={(sym) => setSymbol(sym)}
            placeholder="مثال: COMI أو التجاري الدولي..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            سلوك المزاد / خطة الميكر
          </label>
          <input 
            type="text" 
            value={makerPlan}
            onChange={(e) => setMakerPlan(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:border-blue-500 outline-none transition-colors"
            placeholder="ما هي نية صانع السوق وسبب الدخول؟"
          />
        </div>
      </div>

      {/* Financial Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">سعر الدخول الأول</label>
          <input 
            type="number" 
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full text-base font-black text-blue-700 dark:text-blue-300 py-2 px-3 border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">عدد الأسهم</label>
          <input 
            type="number" 
            step="1"
            value={sharesCount}
            onChange={(e) => setSharesCount(e.target.value)}
            className="w-full text-base font-black text-slate-900 dark:text-white py-2 px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">الهدف (Target)</label>
          <input 
            type="number" 
            step="any"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full text-base font-black text-emerald-700 dark:text-emerald-300 py-2 px-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl focus:border-emerald-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">الوقف (Stop)</label>
          <input 
            type="number" 
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full text-base font-black text-red-700 dark:text-red-300 py-2 px-3 border border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/40 rounded-xl focus:border-red-500 focus:outline-none text-center"
            dir="ltr"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* 3MS Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
          <span className="font-handwriting text-sm text-slate-500 dark:text-slate-400 font-bold">قائمة التحقق الإلزامية (3MS Checklist)</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="space-y-2">
          {checkItems.map(({ key, emoji, label, sublabel }) => {
            const checked = checklist[key as keyof typeof checklist];
            return (
              <label key={key} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                checked 
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}>
                <input 
                  type="checkbox" 
                  checked={checked}
                  onChange={(e) => setChecklist({...checklist, [key]: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="text-lg">{emoji}</span>
                <div className="flex-1">
                  <p className={`font-bold text-xs ${checked ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
                  <p className="font-handwriting text-[11px] text-slate-400 dark:text-slate-500">{sublabel}</p>
                </div>
                {checked && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* Smart Tags */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">التوسيم الذكي (Tags)</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {tags.map((tag, idx) => (
            <span key={idx} className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              #{tag}
              <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="text-purple-400 hover:text-purple-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input 
          type="text" 
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const newTag = tagInput.trim().replace(/^#/, '');
              if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setTagInput('');
              }
            }
          }}
          className="w-full text-xs font-bold text-slate-900 dark:text-white py-2.5 px-4 border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="أضف وسماً واضغط Enter (مثال: اختراق، نموذج_علم، دعم_يومي)"
        />
      </div>

      {/* Images Upload */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
          صور الشارت والتحليل الفني
        </label>
        
        <div 
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 rounded-2xl p-4 text-center hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple
            onChange={(e) => {
              if (e.target.files)
                setImages(prev => [...prev, ...Array.from(e.target.files!).map(f => URL.createObjectURL(f))]);
            }}
          />
          <ImageIcon className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors mb-1" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">اضغط لاختيار صور الشارت أو الصق بـ Ctrl+V</p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square">
                <img src={img} alt="Chart" className="w-full h-full object-cover" />
                <button 
                  type="button"
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
      <div className="pt-2">
        <button 
          type="button"
          disabled={!symbol.trim()}
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            !symbol.trim()
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : allChecked 
                ? 'bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5'
                : 'bg-gradient-to-l from-amber-500 to-amber-400 text-white shadow-md shadow-amber-400/20 hover:-translate-y-0.5'
          }`}
        >
          <Save className="w-4 h-4" />
          {initialData?.id ? 'حفظ التعديلات' : allChecked ? 'توثيق الصفقة والتمركز في الجورنال ✓' : 'تسجيل كصفقة استثنائية (مخالفة) ⚠️'}
        </button>

        {!allChecked && symbol.trim() && (
          <p className="font-handwriting text-xs text-amber-700 dark:text-amber-400 text-center mt-2 font-bold">
            ⚠️ شروط 3MS غير مكتملة — سيتم تسجيلها وتوسيمها للمراجعة والتعلم من الأخطاء
          </p>
        )}
      </div>
    </div>
  );
}
