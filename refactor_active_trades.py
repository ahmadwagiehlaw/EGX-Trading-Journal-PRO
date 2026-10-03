# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State for Fair Value and Analyst Target
if "const [fairValueInput," not in content:
    content = content.replace(
        "const [isEditingRsi, setIsEditingRsi] = useState(false);",
        "const [isEditingRsi, setIsEditingRsi] = useState(false);\n  const [fairValueInput, setFairValueInput] = useState('');\n  const [isEditingFairValue, setIsEditingFairValue] = useState(false);\n  const [analystTargetInput, setAnalystTargetInput] = useState('');\n  const [isEditingAnalystTarget, setIsEditingAnalystTarget] = useState(false);"
    )

# 2. Effects for Fair Value and Analyst Target
if "setFairValueInput(" not in content:
    content = content.replace(
        "if (isEditingRsi) setRsiInput((position.plan?.rsi || 0).toString());",
        "if (isEditingRsi) setRsiInput((position.plan?.rsi || 0).toString());\n      if (!isEditingFairValue) setFairValueInput((position.plan?.fairValue || '').toString());\n      if (!isEditingAnalystTarget) setAnalystTargetInput((position.plan?.analystTarget || '').toString());"
    )

# 3. Handlers for Fair Value and Analyst Target
if "handleUpdateFairValue" not in content:
    content = content.replace(
        "const handleUpdateRsi = async () => {",
        "const handleUpdateFairValue = async () => {\n    if (!position) return;\n    const val = parseFloat(fairValueInput);\n    await updatePosition(position.id, { plan: { ...position.plan, fairValue: isNaN(val) ? undefined : val } } as any);\n    setIsEditingFairValue(false);\n  };\n\n  const handleUpdateAnalystTarget = async () => {\n    if (!position) return;\n    const val = parseFloat(analystTargetInput);\n    await updatePosition(position.id, { plan: { ...position.plan, analystTarget: isNaN(val) ? undefined : val } } as any);\n    setIsEditingAnalystTarget(false);\n  };\n\n  const handleUpdateRsi = async () => {"
    )

# 4. Adding Pills to the Header Grid
# Replace grid classes
content = content.replace(
    'className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full"',
    'className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full"'
)

# Add Pills HTML after RSI Pill
# We find RSI Pill end.
rsi_end = """                  </div>
                  )}"""

idx_rsi_end = content.find(rsi_end, content.find("RSI Pill"))
if idx_rsi_end != -1:
    idx_rsi_end += len(rsi_end)
    
    fundamentals_pills = """

                  {/* Fair Value Pill */}
                  <div className="flex items-center bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden shadow-sm">
                    <button onClick={() => { setIsEditingFairValue(!isEditingFairValue); setIsEditingAnalystTarget(false); setIsEditingMarketPrice(false); }} className="px-2 py-1.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors">السعر العادل:</button>
                    {isEditingFairValue ? (
                      <div className="flex items-center"><input type="number" step="any" value={fairValueInput} onChange={e => setFairValueInput(e.target.value)} className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-teal-900 dark:text-teal-100" dir="ltr" autoFocus placeholder="-" /><button onClick={handleUpdateFairValue} className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1.5 text-[10px] font-bold">حفظ</button></div>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-black text-teal-800 dark:text-teal-200 cursor-pointer hover:text-teal-600 transition-colors font-mono-num" onClick={() => setIsEditingFairValue(true)} dir="ltr">{position!.plan?.fairValue ? position!.plan.fairValue.toFixed(2) : '-'}</div>
                    )}
                  </div>

                  {/* Analyst Target Pill */}
                  <div className="flex items-center bg-fuchsia-50 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800 rounded-lg overflow-hidden shadow-sm">
                    <button onClick={() => { setIsEditingAnalystTarget(!isEditingAnalystTarget); setIsEditingFairValue(false); setIsEditingMarketPrice(false); }} className="px-2 py-1.5 text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors">مستهدف المحللين:</button>
                    {isEditingAnalystTarget ? (
                      <div className="flex items-center"><input type="number" step="any" value={analystTargetInput} onChange={e => setAnalystTargetInput(e.target.value)} className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-fuchsia-900 dark:text-fuchsia-100" dir="ltr" autoFocus placeholder="-" /><button onClick={handleUpdateAnalystTarget} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2 py-1.5 text-[10px] font-bold">حفظ</button></div>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-black text-fuchsia-800 dark:text-fuchsia-200 cursor-pointer hover:text-fuchsia-600 transition-colors font-mono-num" onClick={() => setIsEditingAnalystTarget(true)} dir="ltr">{position!.plan?.analystTarget ? position!.plan.analystTarget.toFixed(2) : '-'}</div>
                    )}
                  </div>
"""
    content = content[:idx_rsi_end] + fundamentals_pills + content[idx_rsi_end:]


# 5. Add Auto-Calculate Button to Targets and Supports
if "handleAutoCalculate" not in content:
    # We add the handler
    content = content.replace(
        "const handleUpdateSupports = async () => {",
        """const handleAutoCalculate = async () => {
    if (!position || !metrics) return;
    const currentAtr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
    if (currentAtr <= 0) {
      alert("الرجاء إدخال قيمة ATR صحيحة أولاً!");
      return;
    }
    const currentPrice = metrics.currentPrice;
    const avgEntry = metrics.avgEntry || currentPrice;
    
    // Calculate Supports
    const s1 = currentPrice - (currentAtr * 1);
    const s2 = currentPrice - (currentAtr * 2);
    const s3 = currentPrice - (currentAtr * 3);
    
    // Calculate Targets
    const t1 = avgEntry + (currentAtr * 1.5);
    const t2 = avgEntry + (currentAtr * 3);
    const t3 = avgEntry + (currentAtr * 5);
    
    await updatePosition(position.id, {
      plan: {
        ...position.plan,
        target: Number(t1.toFixed(2)),
        targets: [Number(t2.toFixed(2)), Number(t3.toFixed(2))],
        supports: [Number(s1.toFixed(2)), Number(s2.toFixed(2)), Number(s3.toFixed(2))]
      }
    } as any);
  };

  const handleUpdateSupports = async () => {"""
    )
    
    # We add the button HTML right above "Targets and Supports" container.
    # Wait, they are in the Advisor tab now!
    targets_marker = '<div className="grid grid-cols-2 gap-4 mb-6">'
    idx_targets_html = content.find(targets_marker)
    if idx_targets_html != -1:
        auto_calc_html = """              <div className="flex justify-between items-center mb-3 mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  المستهدفات والدعوم
                </h3>
                <button onClick={handleAutoCalculate} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black transition-colors border border-indigo-200 dark:border-indigo-800 shadow-sm" title="حساب ديناميكي بناءً على ATR وسعر الدخول">
                  <Zap className="w-3.5 h-3.5" /> حساب تلقائي ⚡
                </button>
              </div>\n"""
        content = content[:idx_targets_html] + auto_calc_html + content[idx_targets_html:]


# 6. Add Smart Advisor Rules for Fair Value & Analyst Target
# We find where insights are generated.
# insights.push({ type: 'info', text: '...' });
insights_marker = "if (analytics.status === 'trailing' && analytics.stopDistancePct > 15) {"
idx_insights = content.find(insights_marker)
if idx_insights != -1:
    fundamental_rules = """
        // Fundamental Advisor Rules
        if (position.plan?.fairValue && metrics.currentPrice) {
          const discount = ((position.plan.fairValue - metrics.currentPrice) / position.plan.fairValue) * 100;
          if (discount > 15) {
            insights.push({
              type: 'success',
              text: `السهم يتداول بخصم ${discount.toFixed(0)}% عن سعره العادل (${position.plan.fairValue}). هامش أمان ممتاز وفرصة رائعة لزيادة التمركز الأساسي (Core).`
            });
          } else if (discount < -15) {
            insights.push({
              type: 'warning',
              text: `تضخم سعري! السهم يتداول بأعلى من سعره العادل بنسبة ${Math.abs(discount).toFixed(0)}%. يُنصح بجني الأرباح جزئياً أو تحويل الكمية إلى مضاربة وتفعيل الوقف بشدة.`
            });
          }
        }
        
        if (position.plan?.analystTarget && metrics.currentPrice) {
          const potential = ((position.plan.analystTarget - metrics.currentPrice) / metrics.currentPrice) * 100;
          if (potential > 20) {
            insights.push({
              type: 'info',
              text: `السهم يستهدف مستويات المحللين عند ${position.plan.analystTarget}، بفرصة صعود متبقية ${potential.toFixed(0)}%. احتفظ بالسهم كاستثمار مدعوم بالبيانات.`
            });
          }
        }
"""
    content = content[:idx_insights] + fundamental_rules + content[idx_insights:]


with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ActiveTrades")
