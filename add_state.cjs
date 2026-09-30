const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// Add tab type to state
c = c.replace(
  "const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');",
  "const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');"
);

if (!c.includes("posTableFilter")) {
  c = c.replace(
    "const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');",
    "const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>('overview');\n  const [posTableFilter, setPosTableFilter] = useState<'all' | 'investment' | 'speculation' | 'open' | 'closed'>('all');"
  );
}

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Added posTableFilter state');
