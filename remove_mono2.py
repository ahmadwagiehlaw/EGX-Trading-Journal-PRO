# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="text-blue-600 dark:text-blue-400 font-mono-num font-black"', 'className="text-blue-600 dark:text-blue-400 font-black"')

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed font-mono-num from avg entry")
