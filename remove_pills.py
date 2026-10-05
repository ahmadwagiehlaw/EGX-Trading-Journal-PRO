# -*- coding: utf-8 -*-
import re
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change the grid class
content = content.replace('className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 w-full"', 'className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full"')

# 2. Use regex to remove the pills
# Fair Value Pill
content = re.sub(r'\{\/\* Fair Value Pill \*\/\}.*?\{\/\* Beta Pill \*\/\}', '{/* Beta Pill */}', content, flags=re.DOTALL)
# Beta Pill to Analyst Target
content = re.sub(r'\{\/\* Beta Pill \*\/\}.*?\{\/\* Analyst Target Pill \*\/\}', '{/* Analyst Target Pill */}', content, flags=re.DOTALL)
# Analyst Target Pill to the end of the div
content = re.sub(r'\{\/\* Analyst Target Pill \*\/\}.*?</div>\s*\{error && isEditingHighestPrice', '</div>\n                  {error && isEditingHighestPrice', content, flags=re.DOTALL)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed unneeded pills!")
