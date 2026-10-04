# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
content = content.replace("  const [rsiInput, setRsiInput] = useState('');", "  const [rsiInput, setRsiInput] = useState('');\n  const [isEditingBeta, setIsEditingBeta] = useState(false);\n  const [betaInput, setBetaInput] = useState('');\n  const [isEditingEma50, setIsEditingEma50] = useState(false);\n  const [ema50Input, setEma50Input] = useState('');")

# Add effect
content = content.replace("setAnalystTargetInput(position?.plan?.analystTarget ? position.plan.analystTarget.toString() : '');", "setAnalystTargetInput(position?.plan?.analystTarget ? position.plan.analystTarget.toString() : '');\n    setBetaInput(position?.plan?.beta ? position.plan.beta.toString() : '');\n    setEma50Input(position?.plan?.ema50 ? position.plan.ema50.toString() : '');")

# Add Handlers
handlers = """  const handleUpdateBeta = async () => {
    if (!position) return;
    const val = parseFloat(betaInput);
    if (!isNaN(val) && val > 0) {
      await updatePosition(position.id, { plan: { ...position.plan, beta: val } } as any);
    }
    setIsEditingBeta(false);
  };

  const handleUpdateEma50 = async () => {
    if (!position) return;
    const val = parseFloat(ema50Input);
    if (!isNaN(val) && val > 0) {
      await updatePosition(position.id, { plan: { ...position.plan, ema50: val } } as any);
    }
    setIsEditingEma50(false);
  };"""

content = content.replace("  const handleUpdateAnalystTarget = async () => {", handlers + "\n\n  const handleUpdateAnalystTarget = async () => {")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed states")
