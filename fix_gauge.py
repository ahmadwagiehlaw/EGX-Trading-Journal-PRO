# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """    const assignLevels = (list: any[]) => {
      let prev = -999;
      let lvl = 0;
      list.forEach(i => {
        if (i.pct - prev < 18) lvl = Math.min(lvl + 1, 2); else lvl = 0;
        i.level = lvl;
        prev = i.pct;
      });
      return list;
    };"""

new_logic = """    const assignLevels = (list: any[]) => {
      let prev = -999;
      let lvl = 0;
      list.forEach(i => {
        if (i.pct - prev < 22) lvl = lvl + 1; else lvl = 0;
        i.level = lvl;
        prev = i.pct;
      });
      return list;
    };"""

content = content.replace(old_logic, new_logic)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Gauge Level Logic")
