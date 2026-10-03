# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract Targets and Supports block
target_start = '              {/* Targets and Supports */}'
target_end = '            </div>\n          )}'

idx_start = content.find(target_start)
idx_end = content.find(target_end, idx_start)

if idx_start != -1 and idx_end != -1:
    targets_block = content[idx_start:idx_end]
    
    # Remove from current location
    content = content[:idx_start] + content[idx_end:]
    
    # Insert at the end of ADVISOR TAB
    # Advisor tab ends right before `          {/* RISK TAB */}`
    # specifically:
    #              )}
    #
    #            </div>
    #          )}
    #
    #          {/* RISK TAB */}
    
    risk_tab_start = '{/* RISK TAB */}'
    idx_risk = content.find(risk_tab_start)
    
    # Find the closing `</div>` of the advisor tab's `animate-in` div!
    # It is right before the `)}` that closes the advisor tab.
    # The structure is:
    #            </div>
    #          )}
    #          {/* RISK TAB */}
    
    # Let's search backward for the `</div>\n          )}`
    idx_insert = content.rfind('            </div>\n          )}', 0, idx_risk)
    
    if idx_insert != -1:
        # We insert it right before the `</div>` that closes the `animate-in` div.
        content = content[:idx_insert] + targets_block + content[idx_insert:]
        print("Moved Targets to Advisor Tab")
    else:
        print("Could not find insert point")

# 2. Fix the padding!
content = content.replace(
    '<div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">',
    '<div className="mb-2">'
)
content = content.replace(
    'className="flex overflow-x-auto items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full [&::-webkit-scrollbar]:hidden"',
    'className="flex overflow-x-auto items-center gap-4 mt-0 mb-4 border-b border-slate-200 dark:border-slate-800 w-full [&::-webkit-scrollbar]:hidden"'
)

# 3. Remove "شراء إضافي" and "بيع جزئي" buttons (Quick Partial Transactions Row)
quick_row_start = '{/* Quick Partial Transactions Row */}'
idx_quick_start = content.find(quick_row_start)
idx_quick_end = content.find('          )}\n', idx_quick_start)

if idx_quick_start != -1 and idx_quick_end != -1:
    content = content[:idx_quick_start] + content[idx_quick_end + 13:]
    print("Removed Quick Partial Row")

# 4. Remove `space-y-6` from the main Left Column flex block so gaps are precise
content = content.replace(
    'flex-col justify-between space-y-6 shadow-sm',
    'flex-col justify-between shadow-sm'
)

# Add `mt-6` to `{/* Close Position (Full Exit) Section */}`
content = content.replace(
    '<div className="pt-4 border-t border-slate-200 dark:border-slate-800">',
    '<div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">'
)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished fixes")
