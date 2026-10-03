const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Insert import
if (!code.includes('WeeklyReviewModal')) {
    code = code.replace("import { formatEGP } from '../utils/calculations';", "import { formatEGP } from '../utils/calculations';\nimport WeeklyReviewModal from './WeeklyReviewModal';");
}

// Add State
if (!code.includes('const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);')) {
    code = code.replace("const { theme } = useTheme();", "const { theme } = useTheme();\n  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);");
}

const bannerCode = `
      <WeeklyReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />

      {/* Quick Action Banner for Weekly Review */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-2xl shrink-0">
               <Activity className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
               <h3 className="text-white font-black text-lg">حان وقت التقييم والمراجعة!</h3>
               <p className="text-indigo-200 text-xs font-bold mt-1 max-w-lg leading-relaxed">
                 استمرارية النجاح تتطلب المراجعة. وثّق أداءك، صفقاتك، وأخطاءك للفترة المنقضية، وحدد نقطة تركيزك للمرحلة القادمة.
               </p>
            </div>
         </div>
         <button 
           onClick={() => setIsReviewModalOpen(true)}
           className="shrink-0 w-full md:w-auto px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-black text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
         >
           <Layers className="w-4 h-4" />
           إجراء المراجعة الآن
         </button>
      </div>
`;

const splitStr = `المضاربة
          </button>
        </div>
      </div>`;

if (code.includes(splitStr) && !code.includes('حان وقت التقييم والمراجعة!')) {
    const parts = code.split(splitStr);
    code = parts[0] + splitStr + "\n" + bannerCode + parts[1];
    fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
    console.log("Added Quick Access Banner to Dashboard");
} else {
    console.log("Could not find insertion point.");
}
