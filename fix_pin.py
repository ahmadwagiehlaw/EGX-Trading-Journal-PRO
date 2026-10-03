# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('X, Pencil, Sparkles, AlertTriangle, TrendingUp', 'X, Pencil, Sparkles, AlertTriangle, TrendingUp, Pin')

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Pin")
