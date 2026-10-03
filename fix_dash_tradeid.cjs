const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Update Props
code = code.replace("interface DashboardProps {\n  onNavigate?: (tab: string) => void;\n}", "interface DashboardProps {\n  onNavigate?: (tab: string) => void;\n  onOpenTrade?: (id: string) => void;\n}");
code = code.replace("export default function Dashboard({ onNavigate }: DashboardProps) {", "export default function Dashboard({ onNavigate, onOpenTrade }: DashboardProps) {");

// Update clickable div
const cardStart = `className="p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all space-y-3"`;
const cardStartNew = `className="p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all space-y-3 cursor-pointer"\n                      onClick={() => onOpenTrade?.(pos.id)}`;
code = code.replace(cardStart, cardStartNew);

fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
console.log("Updated Dashboard.tsx");
