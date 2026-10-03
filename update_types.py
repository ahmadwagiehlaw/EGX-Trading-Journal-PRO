# -*- coding: utf-8 -*-
with open('src/utils/calculations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "makerPlan?: string;",
    "makerPlan?: string;\n    fairValue?: number;\n    analystTarget?: number;"
)

with open('src/utils/calculations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Types")
