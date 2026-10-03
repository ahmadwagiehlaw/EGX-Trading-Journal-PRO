const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

wl = wl.replace(
  /<button\s+onClick=\{\(\) => handleSavePlan\(selectedPlan\)\}[\s\S]*?حفظ الخطة\s*<\/button>/,
  `<button 
                onClick={() => handleSavePlan(selectedPlan)}
                disabled={isSaved}
                className={\`\${isSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-black px-8 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm\`}
              >
                {isSaved ? <CheckSquare className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaved ? 'تم الحفظ بنجاح!' : 'حفظ الخطة'}
              </button>`
);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('Fixed Button');
