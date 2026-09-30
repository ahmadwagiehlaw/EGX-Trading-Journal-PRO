import { useState, useMemo, useEffect } from 'react';
import { Plus, ArrowDownLeft, X, AlertCircle } from 'lucide-react';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import type { Transaction } from '../utils/calculations';
import { computePositionMetrics, formatEGP } from '../utils/calculations';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: TickerPosition | null;
  defaultType?: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';
  defaultShares?: string;
  transactionToEdit?: Transaction | null;
  linkedBuyId?: string;
  inline?: boolean;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  position,
  defaultType = 'buy',
  defaultShares = '',
  transactionToEdit = null,
  linkedBuyId = '',
  inline = false
}: TransactionFormModalProps) {
  const { addTransaction, updateTransaction, capitalInvestment, capitalSpeculation, totalOpenCapitalInvestment, totalOpenCapitalSpeculation } = useTrades();

  const [type, setType] = useState<'buy' | 'sell' | 'dividend' | 'split' | 'bonus'>(defaultType);
  const [priceStr, setPriceStr] = useState('');
  const [sharesStr, setSharesStr] = useState(defaultShares);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolioType, setPortfolioType] = useState<'investment' | 'speculation'>(
    transactionToEdit?.portfolioType || position?.portfolioType || 'investment'
  );

  const [entryReason, setEntryReason] = useState('support');
  const [customEntryReason, setCustomEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('target');
  const [emotion, setEmotion] = useState<'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral'>('neutral');
  const [checklist, setChecklist] = useState({ majorSR: false, bos: false, retest: false });
  const [isRuleBreaker, setIsRuleBreaker] = useState(false);
  const [executionRating, setExecutionRating] = useState<number>(0);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setPriceStr(transactionToEdit.price.toString());
      setSharesStr(transactionToEdit.shares.toString());
      setNote(transactionToEdit.note || '');
      
      if (transactionToEdit.type === 'buy') {
        const er = transactionToEdit.entryReason || 'support';
        if (['support', 'breakout', 'indicator', 'fomo', 'tip', 'avg_down'].includes(er)) {
          setEntryReason(er);
        } else {
          setEntryReason('other');
          setCustomEntryReason(er);
        }
        setChecklist(transactionToEdit.checklist || { majorSR: false, bos: false, retest: false });
      } else {
        setExitReason(transactionToEdit.exitReason || 'target');
      }
      setIsRuleBreaker(transactionToEdit.isRuleBreaker || false);
      setExecutionRating(transactionToEdit.executionRating || 0);
      if (transactionToEdit.emotion) setEmotion(transactionToEdit.emotion);
      if (transactionToEdit.portfolioType) setPortfolioType(transactionToEdit.portfolioType);
    } else {
      setType(defaultType);
      setSharesStr(defaultShares);
      setPriceStr(position?.currentMarketPrice ? position.currentMarketPrice.toString() : '');
    }
  }, [transactionToEdit, defaultType, defaultShares, position]);

  const currentMetrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position, 0.003); // Assuming default 0.3% commission for display limits
  }, [position]);

  if (!isOpen && !inline) return null;
  if (!position || !currentMetrics) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(priceStr);
    const shares = parseInt(sharesStr);
    const amount = price * shares;

    if (isNaN(price) || price <= 0) {
      setError('يرجى إدخال سعر صحيح أكبر من الصفر.');
      return;
    }

    if (isNaN(shares) || shares <= 0) {
      setError('يرجى إدخال عدد أسهم صحيح أكبر من الصفر.');
      return;
    }

    if (type === 'buy') {
      const availablePower = portfolioType === 'investment' 
        ? (capitalInvestment - totalOpenCapitalInvestment) 
        : (capitalSpeculation - totalOpenCapitalSpeculation);
      
      if (amount > availablePower && !transactionToEdit) {
        if (!window.confirm(`تحذير: سيولة الـ ${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (${formatEGP(amount)}). هل أنت متأكد من الاستمرار (سيتم تجاوز السقف)؟`)) {
          return;
        }
      }
    }

    if (type === 'sell' && shares > currentMetrics.openShares && !transactionToEdit) {
      setError(`لا يمكن بيع كمية (${shares}) أكبر من الكمية المفتوحة المتبقية (${currentMetrics.openShares} سهم).`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const finalEntryReason = entryReason === 'other' ? customEntryReason.trim() || 'سبب آخر' : entryReason;

      const rawPayload = {
        type,
        date: transactionToEdit ? transactionToEdit.date : Date.now(),
        price,
        shares,
        amount,
        note: note.trim(),
        linkedBuyId: linkedBuyId || transactionToEdit?.linkedBuyId || null,
        ...(type === 'buy' && { 
          portfolioType, 
          entryReason: finalEntryReason, 
          checklist, 
          emotion, 
          isRuleBreaker, 
          executionRating 
        }),
        ...(type === 'sell' && { 
          exitReason, 
          emotion, 
          mistake: '', 
          isRuleBreaker, 
          executionRating 
        })
      };

      // Safely strip ALL undefined fields to prevent Firebase crash
      const txPayload = JSON.parse(JSON.stringify(rawPayload));

      if (transactionToEdit) {
        await updateTransaction(position.id, transactionToEdit.id, txPayload);
      } else {
        await addTransaction(position.id, txPayload);
      }

      setIsSubmitting(false);
      if (!inline) onClose();
      
      if (inline) {
        setPriceStr('');
        setSharesStr('');
        setNote('');
        setExecutionRating(0);
        setCustomEntryReason('');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'حدث خطأ أثناء حفظ المعاملة.');
    }
  };

  const content = (
    <div className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl ${!inline ? 'shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800' : 'h-full flex-1'} overflow-hidden flex flex-col`}>
      <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${inline ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/70'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
            {position.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-slate-900 dark:text-white" dir="ltr">{position.symbol}</h3>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                {currentMetrics.openShares} سهم مفتوح
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-bold mt-0.5">
              متوسط الدخول الحالي: {currentMetrics.avgEntry.toFixed(2)} EGP
            </p>
          </div>
        </div>

        {!inline && (
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
        <div className="grid grid-cols-4 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
          <button type="button" onClick={() => { setType('buy'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'buy' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            <Plus className="w-3.5 h-3.5" /> شراء إضافي
          </button>
          <button type="button" onClick={() => { setType('sell'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'sell' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            <ArrowDownLeft className="w-3.5 h-3.5" /> بيع جزئي
          </button>
          <button type="button" onClick={() => { setType('dividend'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'dividend' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            توزيع نقدي
          </button>
          <button type="button" onClick={() => { setType('split'); setError(null); }} className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${type === 'split' || type === 'bonus' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
            مجاني/تجزئة
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500">عدد الأسهم</label>
            <input type="number" step="1" required value={sharesStr} onChange={e => setSharesStr(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500">سعر التنفيذ (EGP)</label>
            <input type="number" step="0.001" required value={priceStr} onChange={e => setPriceStr(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-500">ملاحظات حرة (اختياري)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: اشتريت الحمد لله في قاع الجلسة..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 font-bold" />
        </div>

        {type === 'buy' && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">نوع المحفظة</label>
              <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
                <button type="button" onClick={() => setPortfolioType('investment')} className={`py-2 rounded-lg font-bold text-sm transition-all ${portfolioType === 'investment' ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>استثمار</button>
                <button type="button" onClick={() => setPortfolioType('speculation')} className={`py-2 rounded-lg font-bold text-sm transition-all ${portfolioType === 'speculation' ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>مضاربة</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">سبب الدخول الرئيسي</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'support', label: 'دعم قوي' },
                  { id: 'breakout', label: 'اختراق' },
                  { id: 'retest', label: 'إعادة اختبار' },
                  { id: 'indicator', label: 'مؤشرات فنية' },
                  { id: 'fomo', label: 'تسرع / FOMO' },
                  { id: 'tip', label: 'توصية عشوائية' },
                  { id: 'avg_down', label: 'تعديل متوسط' },
                  { id: 'other', label: 'سبب آخر (اكتب)' }
                ].map(r => (
                  <button key={r.id} type="button" onClick={() => setEntryReason(r.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${entryReason === r.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{r.label}</button>
                ))}
              </div>
              {entryReason === 'other' && (
                <input type="text" value={customEntryReason} onChange={e => setCustomEntryReason(e.target.value)} placeholder="اكتب سبب الدخول..." className="w-full mt-2 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold" autoFocus />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">قائمة التحقق 3MS</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'majorSR', label: 'دعم/مقاومة' },
                  { key: 'bos', label: 'كسر هيكل' },
                  { key: 'retest', label: 'إعادة اختبار' }
                ].map(item => (
                  <label key={item.key} className={`flex items-center justify-center p-2 rounded-xl cursor-pointer transition-all border text-xs font-bold ${checklist[item.key as keyof typeof checklist] ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <input type="checkbox" className="hidden" checked={checklist[item.key as keyof typeof checklist]} onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {type === 'sell' && (
           <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500">سبب الخروج الرئيسي</label>
               <div className="flex flex-wrap gap-2">
                 {[
                   { id: 'target', label: 'تحقيق هدف' },
                   { id: 'stop', label: 'ضرب وقف خسارة' },
                   { id: 'trailing', label: 'وقف متحرك' },
                   { id: 'panic', label: 'خوف / هلع' },
                   { id: 'greed', label: 'طمع مفرط' }
                 ].map(r => (
                   <button key={r.id} type="button" onClick={() => setExitReason(r.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${exitReason === r.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{r.label}</button>
                 ))}
               </div>
             </div>
           </div>
        )}

        {(type === 'buy' || type === 'sell') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 block">الحالة النفسية والتركيز</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'neutral', label: '😐 محايد' },
                  { id: 'fomo', label: '🏃 تسرع' },
                  { id: 'fear', label: '😨 خوف' },
                  { id: 'greed', label: '🤑 طمع' },
                  { id: 'confident', label: '😎 واثق' }
                ].map(emo => (
                  <button key={emo.id} type="button" onClick={() => setEmotion(emo.id as any)} className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all border ${emotion === emo.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {emo.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 flex flex-col justify-between">
              <label className="text-xs font-black text-slate-500 block">تقييم جودة التنفيذ (اليمين لليسار)</label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 h-full flex-row-reverse" dir="ltr">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setExecutionRating(star)} className={`text-2xl transition-all transform hover:scale-125 ${executionRating >= star ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 grayscale opacity-40'}`}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(type === 'buy' || type === 'sell') && (
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isRuleBreaker ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <input type="checkbox" className="w-4 h-4 rounded text-red-600 focus:ring-red-500" checked={isRuleBreaker} onChange={e => setIsRuleBreaker(e.target.checked)} />
            <span className="text-xs font-bold">هل خالفت الخطة أو قواعد التداول؟ (تسجيل مخالفة)</span>
          </label>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? 'جاري الحفظ...' : transactionToEdit ? 'حفظ التعديلات' : 'إضافة المعاملة'}
        </button>
      </form>
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      {content}
    </div>
  );
}
