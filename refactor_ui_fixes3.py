# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make tabs scrollable but hide scrollbar using tailwind arbitrary variants
content = content.replace(
    'className="flex overflow-x-auto items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full" style={{ scrollbarWidth: "none" }}',
    'className="flex overflow-x-auto items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}'
)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("UI fixed 3")
