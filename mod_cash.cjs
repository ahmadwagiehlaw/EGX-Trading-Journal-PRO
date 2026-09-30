const fs = require('fs');
let c = fs.readFileSync('src/components/CashLedger.tsx', 'utf8');

c = c.replace(/const \[type, setType\] = useState<'deposit' \| 'withdrawal'>\('deposit'\);/, "const [type, setType] = useState<'deposit' | 'withdrawal' | 'profit_distribution'>('deposit');");

c = c.replace(/<div className="flex gap-2 mb-6">[\s\S]*?<\/div>/, `<div className="flex gap-2 mb-6">
            <button
              onClick={() => setType('deposit')}
              className={\`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${
                type === 'deposit' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }\`}
            >
              <ArrowDownToLine className="w-5 h-5" />
              إيداع
            </button>
            <button
              onClick={() => setType('withdrawal')}
              className={\`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${
                type === 'withdrawal' 
                  ? 'bg-rose-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }\`}
            >
              <ArrowUpFromLine className="w-5 h-5" />
              سحب
            </button>
            <button
              onClick={() => setType('profit_distribution')}
              className={\`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${
                type === 'profit_distribution' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }\`}
            >
              <Gift className="w-5 h-5" />
              توزيع أرباح
            </button>
          </div>`);

c = c.replace(/import \{.*?\} from 'lucide-react';/, "import { ArrowDownToLine, ArrowUpFromLine, Trash2, Calendar, DollarSign, Wallet, Building2, Briefcase, Plus, Gift } from 'lucide-react';");

c = c.replace(/entry\.type === 'deposit' \? 'إيداع نقدي' : 'سحب نقدي'/g, "entry.type === 'deposit' ? 'إيداع نقدي' : entry.type === 'profit_distribution' ? 'توزيع أرباح للشركاء' : 'سحب نقدي'");

c = c.replace(/entry\.type === 'deposit' \? '\+' : '-'/g, "entry.type === 'deposit' ? '+' : '-'");

c = c.replace(/entry\.type === 'deposit' \? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'/g, "entry.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : entry.type === 'profit_distribution' ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'");

c = c.replace(/entry\.type === 'deposit' \? 'bg-emerald-50 dark:bg-emerald-900\/30 text-emerald-600 dark:text-emerald-500' : 'bg-rose-50 dark:bg-rose-900\/30 text-rose-600 dark:text-rose-500'/g, "entry.type === 'deposit' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : entry.type === 'profit_distribution' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-500' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500'");

c = c.replace(/<ArrowDownToLine className="w-4 h-4" \/> : <ArrowUpFromLine className="w-4 h-4" \/>/g, "<ArrowDownToLine className=\"w-4 h-4\" /> : entry.type === 'profit_distribution' ? <Gift className=\"w-4 h-4\" /> : <ArrowUpFromLine className=\"w-4 h-4\" />");

fs.writeFileSync('src/components/CashLedger.tsx', c, 'utf8');
console.log('Modified CashLedger.tsx');
