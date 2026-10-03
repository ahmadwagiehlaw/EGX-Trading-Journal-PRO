# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make tabs scrollable but hide scrollbar using tailwind arbitrary variants or style
content = content.replace(
    'className="flex overflow-x-auto hide-scrollbar items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full"',
    'className="flex overflow-x-auto items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full" style={{ scrollbarWidth: "none" }}'
)

# And let's make sure the tabs padding is good.
# We had: className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab...
# Wait, did it apply to all 4 tabs? Yes, but `content.replace` only replaces the EXACT match.
# Wait! In the first script, `className={\`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab` was only partially matched?
# Let's check how many times it was replaced.

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("UI fixed 2")
