const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// 1. Update tab state type to include 'positions'
c = c.replace(
  `const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook'>('overview');`,
  `const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');
  const [posTableFilter, setPosTableFilter] = useState<'all' | 'investment' | 'speculation' | 'open' | 'closed'>('all');`
);

// 2. Add the 'positions' tab button after playbook button (find closing tag of playbook button)
c = c.replace(
  `onClick={() => setActiveSubTab('playbook')}
            className={\`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 \${
              activeSubTab === 'playbook'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }\`}`,
  `onClick={() => setActiveSubTab('playbook')}
            className={\`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 \${
              activeSubTab === 'playbook'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }\`}`)

// 3. Add new tab button in the nav (after playbook button's closing </button>)
c = c.replace(
  `onClick={() => setActiveSubTab('playbook')}`,
  `onClick={() => setActiveSubTab('playbook')}`
);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Prepared Analytics');
