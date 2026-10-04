# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken string
content = content.replace("}}setIsEditingBeta(false); setIsEditingEma50(false);", " setIsEditingBeta(false); setIsEditingEma50(false); }}")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed syntax")
