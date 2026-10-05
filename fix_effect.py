# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("      if (!isEditingFairValue) setFairValueInput((position.plan?.fairValue || '').toString());\n", "")
content = content.replace("      if (!isEditingAnalystTarget) setAnalystTargetInput((position.plan?.analystTarget || '').toString());\n", "")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed effect")
