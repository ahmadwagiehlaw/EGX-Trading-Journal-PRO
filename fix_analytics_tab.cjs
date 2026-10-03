const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const tabsIdx = code.indexOf('activeSubTab === \'playbook\'');
const tabHeaderEnd = code.indexOf('</button>', tabsIdx) + 9;

const newTab = `

        <button
          onClick={() => setActiveSubTab('weekly_review')}
          className={\`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 \${
            activeSubTab === 'weekly_review'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }\`}
        >
          <Layers className="w-4 h-4" />
          مراجعة نهاية الأسبوع (Weekly Review)
        </button>`;

code = code.slice(0, tabHeaderEnd) + newTab + code.slice(tabHeaderEnd);
fs.writeFileSync('src/components/Analytics.tsx', code, 'utf8');
console.log("Added weekly_review tab header");
