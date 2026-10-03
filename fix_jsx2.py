# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = """            </div>

</div>

            {/* Smart Trailing Stop Tools */}"""

good_str = """            </div>

            {/* Smart Trailing Stop Tools */}"""

content = content.replace(bad_str, good_str)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed stray div")
