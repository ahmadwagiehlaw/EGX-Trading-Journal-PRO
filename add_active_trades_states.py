# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ADD STATES
old_states = """  const [isEditingFairValue, setIsEditingFairValue] = useState(false);
  const [fairValueInput, setFairValueInput] = useState('');
  
  const [isEditingAnalystTarget, setIsEditingAnalystTarget] = useState(false);
  const [analystTargetInput, setAnalystTargetInput] = useState('');"""

new_states = """  const [isEditingFairValue, setIsEditingFairValue] = useState(false);
  const [fairValueInput, setFairValueInput] = useState('');
  
  const [isEditingAnalystTarget, setIsEditingAnalystTarget] = useState(false);
  const [analystTargetInput, setAnalystTargetInput] = useState('');
  
  const [isEditingBeta, setIsEditingBeta] = useState(false);
  const [betaInput, setBetaInput] = useState('');
  
  const [isEditingEma50, setIsEditingEma50] = useState(false);
  const [ema50Input, setEma50Input] = useState('');"""

content = content.replace(old_states, new_states)

# ADD EFFECT
old_effect = """    setFairValueInput(position?.plan?.fairValue ? position.plan.fairValue.toString() : '');
    setAnalystTargetInput(position?.plan?.analystTarget ? position.plan.analystTarget.toString() : '');
  }, [position]);"""

new_effect = """    setFairValueInput(position?.plan?.fairValue ? position.plan.fairValue.toString() : '');
    setAnalystTargetInput(position?.plan?.analystTarget ? position.plan.analystTarget.toString() : '');
    setBetaInput(position?.plan?.beta ? position.plan.beta.toString() : '');
    setEma50Input(position?.plan?.ema50 ? position.plan.ema50.toString() : '');
  }, [position]);"""

content = content.replace(old_effect, new_effect)

# ADD HANDLERS
old_handlers = """  const handleUpdateAnalystTarget = async () => {
    if (!position || !metrics) return;
    const val = parseFloat(analystTargetInput);
    if (!isNaN(val) && val >= 0) {
      await updatePosition(position.id, { plan: { ...position.plan, analystTarget: val } } as any);
    }
    setIsEditingAnalystTarget(false);
  };"""

new_handlers = """  const handleUpdateAnalystTarget = async () => {
    if (!position || !metrics) return;
    const val = parseFloat(analystTargetInput);
    if (!isNaN(val) && val >= 0) {
      await updatePosition(position.id, { plan: { ...position.plan, analystTarget: val } } as any);
    }
    setIsEditingAnalystTarget(false);
  };
  
  const handleUpdateBeta = async () => {
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

content = content.replace(old_handlers, new_handlers)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated States & Handlers")
