const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// I need to import Brain or lightbulb icon
if (!code.includes('Lightbulb')) {
    code = code.replace("Maximize2", "Maximize2, Lightbulb");
}

const insightsLogic = `
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
      const coreAmount = position.coreShares ? position.coreShares * position.currentMarketPrice : 0;
      const totalCap = coreStats.totalInvestmentCapital || 1;
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

    return insights;
  };
  const insights = useMemo(generateInsights, [position, metrics, coreStats]);
`;

const sIdx = code.indexOf('const handleUpdateTrailingStop');
code = code.slice(0, sIdx) + insightsLogic + "\n  " + code.slice(sIdx);

const insightsUI = `
        {/* Smart Insights AI */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-5 border border-blue-100 dark:border-blue-800 shadow-sm relative overflow-hidden mt-6 mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-white">المستشار الذكي للتمركز (AI Insights)</h3>
            </div>
            <div className="space-y-3 relative z-10">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-white/60 dark:bg-slate-900/40 p-3 rounded-2xl border border-white/40 dark:border-slate-700/50">
                  <div className={\`shrink-0 mt-1 w-2 h-2 rounded-full \${insight.type === 'warning' ? 'bg-amber-500' : insight.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}\`}></div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
`;

const renderIdx = code.indexOf('{/* Main Content Grid */}');
code = code.slice(0, renderIdx) + insightsUI + "\n        " + code.slice(renderIdx);

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Added Insights Panel');
