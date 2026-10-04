# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the timeline chart to use netRealizedPnL
# It currently has:
#   metrics!.realizedPnL > 0
#   ? 'bg-emerald-100 border-emerald-300 text-emerald-800 ...'
#   : metrics!.realizedPnL < 0
#     ? 'bg-rose-100 border-rose-300 text-rose-800 ...'
#     : 'bg-white border-slate-200 text-slate-700 ...'
# }`}>
#   صافي الأرباح المحققة: {metrics!.realizedPnL > 0 ? '+' : ''}{metrics!.realizedPnL.toFixed(2)} EGP

content = content.replace("metrics!.realizedPnL > 0", "metrics!.netRealizedPnL > 0")
content = content.replace("metrics!.realizedPnL < 0", "metrics!.netRealizedPnL < 0")
content = content.replace("{metrics!.realizedPnL.toFixed(2)} EGP", "{metrics!.netRealizedPnL.toFixed(2)} EGP")

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated to Net Realized PnL")
