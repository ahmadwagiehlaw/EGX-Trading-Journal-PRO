# -*- coding: utf-8 -*-
import re
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines_to_remove = [
    "const [isEditingFairValue, setIsEditingFairValue] = useState(false);",
    "const [fairValueInput, setFairValueInput] = useState('');",
    "const [isEditingAnalystTarget, setIsEditingAnalystTarget] = useState(false);",
    "const [analystTargetInput, setAnalystTargetInput] = useState('');",
    "const [isEditingBeta, setIsEditingBeta] = useState(false);",
    "const [betaInput, setBetaInput] = useState('');",
    "const [isEditingEma50, setIsEditingEma50] = useState(false);",
    "const [ema50Input, setEma50Input] = useState('');"
]

for l in lines_to_remove:
    content = content.replace(l, "")

# Remove unused handlers using regex
content = re.sub(r'  const handleUpdateFairValue = async \(\) => \{.*?setIsEditingFairValue\(false\);\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'  const handleUpdateBeta = async \(\) => \{.*?setIsEditingBeta\(false\);\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'  const handleUpdateEma50 = async \(\) => \{.*?setIsEditingEma50\(false\);\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'  const handleUpdateAnalystTarget = async \(\) => \{.*?setIsEditingAnalystTarget\(false\);\n  \};\n', '', content, flags=re.DOTALL)

# Remove them from the useEffect
content = content.replace("setFairValueInput(position?.plan?.fairValue ? position.plan.fairValue.toString() : '');", "")
content = content.replace("setAnalystTargetInput(position?.plan?.analystTarget ? position.plan.analystTarget.toString() : '');", "")
content = content.replace("setBetaInput(position?.plan?.beta ? position.plan.beta.toString() : '');", "")
content = content.replace("setEma50Input(position?.plan?.ema50 ? position.plan.ema50.toString() : '');", "")

# Remove them from the onClick of the remaining pills (Market Price, Highest Price, ATR, RSI)
content = re.sub(r'setIsEditingFairValue\(false\); setIsEditingAnalystTarget\(false\); setIsEditingBeta\(false\); setIsEditingEma50\(false\); ', '', content)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed unused code")
