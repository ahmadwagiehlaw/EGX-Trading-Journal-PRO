const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. RE-ADD CORE SHARES & AI ADVISOR
// I will check if they exist, if not, inject them.

if (!code.includes('handleSaveCoreShares')) {
    // We need to inject the Core Shares state and UI
    const stateHookInsert = `
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  
  useEffect(() => {
    if (!isEditingCoreShares && position) {
      setCoreSharesInput(position.coreShares?.toString() || '');
    }
  }, [position?.coreShares, isEditingCoreShares, position]);

  const handleSaveCoreShares = async () => {
    if (!position || !metrics) return;
    const val = parseInt(coreSharesInput);
    if (isNaN(val) || val < 0 || val > metrics.openShares) {
      alert('يجب أن تكون كمية الكور رقم صحيح بين 0 والكمية المفتوحة بالكامل (' + metrics.openShares + ')');
      return;
    }
    await updatePosition(position.id, { coreShares: val });
    setIsEditingCoreShares(false);
  };
`;
    const earlyReturnIdx = code.indexOf('if (!position || !metrics) return null;');
    code = code.slice(0, earlyReturnIdx) + stateHookInsert + code.slice(earlyReturnIdx);

    // AI Advisor
    const insightsFunc = `
  // --- Smart Insights Engine ---
  const generateInsights = () => {
    if (!position || !metrics) return [];
    const insights: { text: string; type: 'warning' | 'info' | 'success'; action?: string }[] = [];
    const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;
    
    // 1. Profit Taking / Risk
    if (pnlPercent > 15) {
      insights.push({ type: 'success', text: \`أنت محقق ربح ممتاز بحوالي \${pnlPercent.toFixed(1)}% في هذا التمركز. يوصى بجني جزء من الأرباح (بيع جزئي) لتأمين المكسب.\`, action: 'بيع جزئي' });
    } else if (pnlPercent < -8) {
      insights.push({ type: 'warning', text: \`التمركز خاسر بنسبة \${Math.abs(pnlPercent).toFixed(1)}%. راقب وقف الخسارة بصرامة ولا تترك الخسارة تتفاقم.\` });
    }

    // 2. Trailing Stop
    const riskPercent = metrics.avgEntry > 0 ? ((metrics.avgEntry - metrics.currentStop) / metrics.avgEntry) * 100 : 0;
    if (pnlPercent > 5 && riskPercent > 0) {
      insights.push({ type: 'info', text: 'السعر ارتفع بشكل جيد لكن وقف الخسارة لا يزال تحت سعر الدخول. يوصى برفع وقف الخسارة (Trailing Stop) لنقطة الدخول أو أعلى لحماية رأس المال.' });
    }

    // 3. Core/Satellite specific (Investment)
    if (position.portfolioType === 'investment') {
      const coreAmount = position.coreShares ? position.coreShares * (position.currentMarketPrice || 0) : 0;
      const totalCap = coreStats?.totalInvestmentCapital || 1;
      const coreWeight = (coreAmount / totalCap) * 100;
      
      if (coreAmount === 0 && position.plan?.strategy === 'core') {
         insights.push({ type: 'info', text: 'هذا السهم مصنف كـ (Core) لكنك لم تحدد كمية الكور المحتفظ بها. قم بتحديد أسهم الكور لحمايتها من البيع العاطفي.' });
      } else if (coreWeight > 30) {
         insights.push({ type: 'warning', text: \`وزن هذا السهم الأساسي يشكل \${coreWeight.toFixed(1)}% من إجمالي محفظة الاستثمار. هذا تركز عالي وقد يزيد المخاطرة، فكر في إعادة التوازن.\` });
      }
    }

    // 4. Time Decay (Speculation)
    if (position.portfolioType === 'speculation' && position.journal?.openedDate) {
      const daysHeld = (Date.now() - position.journal.openedDate) / (1000 * 60 * 60 * 24);
      if (daysHeld > 14 && pnlPercent < 2) {
        insights.push({ type: 'warning', text: \`هذا التمركز المضاربي مستمر منذ \${Math.floor(daysHeld)} يوم بدون ربح يذكر. انتبه لتكلفة الفرصة البديلة (Cash Drag).\` });
      }
    }

    if (insights.length === 0) {
      insights.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    return insights;
  };
  const insights = generateInsights();
`;
    const trailingFuncIdx = code.indexOf('const handleUpdateTrailingStop');
    code = code.slice(0, trailingFuncIdx) + insightsFunc + code.slice(trailingFuncIdx);
}

// 2. INJECT UI FOR CORE SHARES AND AI ADVISOR
if (!code.includes('المستشار الذكي')) {
    // Inject AI Advisor Panel before "معلومات السهم"
    const aiPanel = `
          {/* Smart Insights Panel */}
          {insights.length > 0 && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI)</h3>
              </div>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className={\`flex items-start gap-3 p-3 rounded-xl \${
                    insight.type === 'warning' ? 'bg-rose-100/50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200' :
                    insight.type === 'success' ? 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200' :
                    'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }\`}>
                    <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                    {insight.action && (
                      <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
                        {insight.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
`;
    // Find where to put it
    const infoHeader = '<h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">';
    const headerBlockIdx = code.indexOf(infoHeader);
    if (headerBlockIdx > -1) {
        // go back to the wrapping div of this section
        const wrapIdx = code.lastIndexOf('<div className="space-y-6">', headerBlockIdx);
        if (wrapIdx > -1) {
            code = code.slice(0, wrapIdx + 27) + aiPanel + code.slice(wrapIdx + 27);
        }
    }
}

if (!code.includes('كمية الكور')) {
    // Inject Core Shares UI inside the Info Grid
    const coreUI = `
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">كمية الكور (Core)</span>
                  {isEditingCoreShares ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-20 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-black px-2 py-1 outline-none text-left"
                        value={coreSharesInput}
                        onChange={e => setCoreSharesInput(e.target.value)}
                        autoFocus
                        dir="ltr"
                      />
                      <button onClick={handleSaveCoreShares} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><CheckCircle className="w-4 h-4"/></button>
                      <button onClick={() => setIsEditingCoreShares(false)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingCoreShares(true)}>
                      <span className="font-mono-num font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        {position?.coreShares || 0} سهم
                      </span>
                      <Pencil className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
`;
    const infoGridEnd = code.indexOf('</div>\n\n            {/* Trailing Stop Engine */}');
    if (infoGridEnd > -1) {
        code = code.slice(0, infoGridEnd) + coreUI + code.slice(infoGridEnd);
    }
}

// 3. Make sure Sparkles is imported
if (!code.includes('Sparkles')) {
    code = code.replace("AlertTriangle, \n  CheckCircle", "Sparkles, \n  AlertTriangle, \n  CheckCircle");
}
if (!code.includes('coreStats')) {
    code = code.replace("const { positions, updateTrailingStop, updatePosition, deleteTransaction } = useTrades();", "const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats } = useTrades();");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Restored AI Advisor and Core Shares to ActiveTrades.tsx");
