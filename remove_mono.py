# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace font-mono-num in the openShares display
old_shares = '<p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono-num drop-shadow-sm">'
new_shares = '<p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">'
content = content.replace(old_shares, new_shares)

# Replace in the strip
content = content.replace('font-black font-mono-num', 'font-black tracking-tight')

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed font-mono-num from header")
