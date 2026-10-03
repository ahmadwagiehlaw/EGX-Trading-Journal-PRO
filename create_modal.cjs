const fs = require('fs');
const content = `import { X, ShieldAlert, Clock, Target, ArrowUpRight, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConceptsGuideModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">دليل مصطلحات التداول</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">شرح مبسط لأهم المفاهيم في خطة التداول</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* RRR Section */}
          <section>
            <h3 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-3">
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
              نسبة العائد للمخاطرة (Risk/Reward Ratio - RRR)
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                هو أهم مقياس في التداول الاحترافي، يخبرك ببساطة: <strong>"كم ستربح مقابل كل جنيه تخاطر بخسارته؟"</strong>.
              </p>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>المعادلة:</span>
                  <span className="font-mono-num text-blue-600 dark:text-blue-400" dir="ltr">(Target - Entry) / (Entry - Stop)</span>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>مثال:</strong> اشتريت سهماً بسعر 10 جنيهات، ووضعت وقف الخسارة عند 9 جنيهات (مخاطرة بـ 1 جنيه). ووضعت هدفك عند 12 جنيهاً (عائد 2 جنيه).
                  <br />
                  <span className="text-emerald-600 font-bold mt-1 inline-block">النسبة هنا هي 2:1 (العائد ضعف المخاطرة).</span>
                </p>
              </div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 p-2 rounded-lg">
                ⚠️ لا تدخل أبداً صفقة نسبة العائد للمخاطرة فيها أقل من 1:2.
              </p>
            </div>
          </section>

          {/* Time Stop Section */}
          <section>
            <h3 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
              الوقف الزمني (Time Stop)
            </h3>
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                في السوق، <strong>الوقت هو تكلفة (Cash Drag)</strong>. الوقف الزمني هو الحد الأقصى للأيام التي ستصبر فيها على السهم إذا لم يتحرك في اتجاه هدفك ولم يضرب وقف الخسارة.
              </p>
              <ul className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                <li>الأسهم التي تبقى مكانها تجمد سيولتك وتمنعك من اقتناص فرص أخرى تتحرك.</li>
                <li>المتداول المحترف يحدد وقتاً (مثلاً 10 أو 20 جلسة). إذا انتهى الوقت والسهم ما زال يتذبذب ببطء حول نقطة الدخول، يقوم بالخروج أو تقليل الكمية.</li>
              </ul>
            </div>
          </section>

          {/* Playbooks Section */}
          <section>
            <h3 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-3">
              <Target className="w-5 h-5 text-blue-500" />
              أشهر استراتيجيات التداول (Playbooks)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-blue-700 dark:text-blue-400 text-xs flex items-center gap-1 mb-1.5"><ArrowUpRight className="w-3 h-3"/> VCP (مارك مينيرفيني)</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  السهم يكون في اتجاه صاعد قوي، ثم يدخل في مرحلة تماسك تضيق فيها تذبذباته ويجف حجم التداول (Volume Dry-up). الدخول يكون مع أول اختراق لأعلى بحجم تداول ضخم.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1 mb-1.5"><ArrowUpRight className="w-3 h-3"/> الارتداد من المتوسطات (MA Bounce)</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  سهم قوي يصحح هبوطاً حتى يلمس متوسط متحرك مهم (مثل 20 أو 50 يوم). تظهر شمعة انعكاسية (مثل Hammer) عند المتوسط ليتم الشراء باستهداف القمة السابقة.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-purple-700 dark:text-purple-400 text-xs flex items-center gap-1 mb-1.5"><ArrowUpRight className="w-3 h-3"/> اختراق المقاومة (Breakout)</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  سهم يختبر مستوى مقاومة أفقية لعدة مرات، ثم يخترقه بقوة وزخم شرائي عالي. يجب الانتظار لإغلاق قوي فوق المقاومة قبل الدخول، ويكون الوقف أسفل شمعة الاختراق.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1 mb-1.5"><ArrowUpRight className="w-3 h-3"/> الشراء من الدعم (Support Buy)</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  أبسط الاستراتيجيات؛ الشراء عند اقتراب السعر من قاع تاريخي أو مستوى دعم قوي اختبره السهم مسبقاً ولم يكسره، مع وضع الوقف أسفل الدعم مباشرة لتقليل المخاطرة.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/ConceptsGuideModal.tsx', content, 'utf8');
console.log('✓ Created ConceptsGuideModal.tsx');
