const fs = require('fs');
let c = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

if (!c.includes('showPlaybookInfo')) {
  c = c.replace(
    'const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);',
    'const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n  const [showPlaybookInfo, setShowPlaybookInfo] = useState(false);'
  );
}

if (!c.includes('HelpCircle')) {
  c = c.replace(
    'import { Plus, Target, Clock, ArrowRight, CheckSquare, X, Save, Search, LineChart, FileText, Trash2, ArrowUpDown } from \'lucide-react\';',
    'import { Plus, Target, Clock, ArrowRight, CheckSquare, X, Save, Search, LineChart, FileText, Trash2, ArrowUpDown, HelpCircle } from \'lucide-react\';'
  );
}

const newLabelBlock = `<div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        استراتيجية التداول (Playbook)
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowPlaybookInfo(!showPlaybookInfo)}
                        className="text-[10px] flex items-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg font-bold transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" />
                        شرح الاستراتيجيات
                      </button>
                    </div>`;

c = c.replace(/<label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-1\.5 flex items-center gap-1">[\s\S]*?استراتيجية التداول \(Playbook\)[\s\S]*?<\/label>/, newLabelBlock);

const selectOldClass = 'className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none mb-3"';
const selectNewClass = 'className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none mb-3 cursor-pointer"';

c = c.replace(selectOldClass, selectNewClass);

const infoBox = `
                  {showPlaybookInfo && (
                    <div className="mb-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3.5 rounded-2xl text-xs space-y-3">
                      <div>
                        <strong className="text-blue-800 dark:text-blue-300 flex items-center gap-1 mb-1"><Target className="w-3 h-3"/> استراتيجية VCP (مارك مينيرفيني)</strong>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">تعتمد على إيجاد أسهم في اتجاه صاعد، تمر بفترة تماسك وتقلص في التذبذب (انخفاض حجم التداول). الدخول يكون مع اختراق المقاومة بحجم تداول ضخم.</p>
                      </div>
                      <div>
                        <strong className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1"><Target className="w-3 h-3"/> استراتيجية الارتداد (Pullback)</strong>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">الشراء عندما يتراجع السعر (يصحح) نحو مستوى دعم قوي أو متوسط متحرك (مثل 20 أو 50 يوم) دون أن يكسره بقوة، مع ظهور شموع انعكاسية.</p>
                      </div>
                      <div>
                        <strong className="text-orange-800 dark:text-orange-300 flex items-center gap-1 mb-1"><Target className="w-3 h-3"/> استراتيجية الزخم (Momentum / Gap Up)</strong>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">تعتمد على الأخبار القوية أو الأرباح الاستثنائية التي تسبب قفزة سعرية (فجوة لأعلى)، وندخل مع استمرار الزخم والقوة الشرائية العنيفة.</p>
                      </div>
                    </div>
                  )}
`;

const selectRegex = /<\/select>/;
c = c.replace(selectRegex, '</select>\n' + infoBox);


fs.writeFileSync('src/components/Watchlist.tsx', c, 'utf8');
console.log('Done');
