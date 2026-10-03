# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

tabs_header = "{/* TABS HEADER */}"
idx = content.find(tabs_header)
if idx != -1:
    content = content[:idx] + "          </div>\n\n          " + content[idx:]

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected div close")
