const fs = require('fs');
const S = 'C:/Users/ahmed/.gemini/antigravity/brain/d6f5dce2-59b9-4b9b-8462-7a96cb31d7fd/scratch/';
const snip = n => fs.readFileSync(S + n, 'utf8');
const file = 'src/components/ActiveTrades.tsx';
let code = fs.readFileSync(file, 'utf8');
fs.writeFileSync(S + 'ActiveTrades.backup.tsx', code);

function count(s, sub) { return s.split(sub).length - 1; }
function rep(from, to) {
  if (count(code, from) !== 1) throw new Error('Anchor count=' + count(code, from) + ' for: ' + from.slice(0, 70));
  code = code.replace(from, () => to);
}
function repRe(re, to) {
  const m = code.match(re);
  if (!m) throw new Error('Regex not found: ' + re);
  code = code.replace(re, typeof to === 'function' ? to : () => to);
}
function cutFn(startMarker, replacement) {
  const i = code.indexOf(startMarker);
  if (i < 0 || count(code, startMarker) !== 1) throw new Error('fn not unique: ' + startMarker);
  const j = code.indexOf('\n  };', i);
  if (j < 0) throw new Error('fn end not found: ' + startMarker);
  code = code.slice(0, i) + replacement + code.slice(j + 5);
}

// imports
rep(', X, Pencil, Sparkles', ', X, Pencil, Sparkles, AlertTriangle, TrendingUp');
rep("import { computePositionMetrics, computeOpenLotsLowestPriceFirst } from '../utils/calculations';",
    "import { computePositionMetrics, computeOpenLotsLowestPriceFirst, computeStopAnalytics, formatEGP, type TrailingStopState } from '../utils/calculations';");
rep('const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats } = useTrades();',
    'const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats, capitalInvestment, capitalSpeculation, commissionRate } = useTrades();');
repRe(/return computePositionMetrics\(position\);(\s*)\}, \[position\]\);/, 'return computePositionMetrics(position, commissionRate);$1}, [position, commissionRate]);');

// states + analytics (after manualStopInput state)
rep("const [manualStopInput, setManualStopInput] = useState('');", "const [manualStopInput, setManualStopInput] = useState('');\n" + snip('s_states.txt'));

// handlers
cutFn('  const handleUpdateMarketPrice = async () => {', '');
cutFn('  const handleUpdateAtr = async () => {', '');
cutFn('  const handleManualStopUpdate = async () => {', snip('s_handlers.txt').replace(/\s+$/, ''));

// alert -> inline error
repRe(/alert\('يجب أن تكون كمية الكور رقم صحيح بين 0 والكمية المفتوحة بالكامل \(' \+ metrics\.openShares \+ '\)'\);/, "setCoreError('يجب أن تكون كمية الكور رقماً صحيحاً بين 0 والكمية المفتوحة (' + metrics.openShares + ')');");
rep('await updatePosition(position.id, { coreShares: val });\n    setIsEditingCoreShares(false);', 'setCoreError(null);\n    await updatePosition(position.id, { coreShares: val });\n    setIsEditingCoreShares(false);');

// insights
rep('const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;',
    'const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;\n' + snip('s_insights.txt'));

// trailing handler multiplier
rep('const calculatedNewStop = atrVal > 0 ? highest - (2 * atrVal) : highest * 0.95;',
    'const calculatedNewStop = atrVal > 0 ? highest - ((position!.trailingStop?.atrMultiplier || 2) * atrVal) : highest * 0.95;');

// gauge vars before return
repRe(/\n  return \(\r?\n    <div className="w-full space-y-6" dir="rtl">/, m => '\n' + snip('s_gauge_vars.txt') + m.slice(1));


// gauge container: dynamic margins
rep('className="relative h-16 w-full flex items-center mt-8 mb-4"', 'className="relative h-16 w-full flex items-center" style={{ marginTop: gauge.mt, marginBottom: gauge.mb }}');

// markers region
repRe(/\{\/\* Markers \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\{\/\* Trailing Stop Metrics Cards \*\/\})/, snip('s_markers.txt'));

// initial stop card
repRe(/<div className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono-num" dir="ltr">[\s\S]*?<\/div>/, snip('s_initcard.txt'));

// banner + indicators strip
rep('{/* Plan vs Reality Visual Chart */}', snip('s_banner_strip.txt').replace(/\s+$/, '') + '\n\n            {/* Plan vs Reality Visual Chart */}');

// stop tools
rep('{/* Core / Satellite Advanced Bar */}', snip('s_tools.txt').replace(/\s+$/, '') + '\n\n            {/* Core / Satellite Advanced Bar */}');

// core suggestion after legend
repRe(/(<div className="w-2 h-2 rounded-full bg-amber-400"><\/div>\s*<\/div>\s*<\/div>)/, m => m + '\n' + snip('s_core.txt'));

fs.writeFileSync(file, code, 'utf8');
console.log('APPLIED OK');

