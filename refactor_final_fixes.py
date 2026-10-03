# -*- coding: utf-8 -*-
import sys

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove massive padding and border from Header block
content = content.replace(
    '<div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">',
    '<div className="mb-2">'
)
content = content.replace(
    'className="flex overflow-x-auto items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full',
    'className="flex overflow-x-auto items-center gap-4 mt-0 mb-4 border-b border-slate-200 dark:border-slate-800 w-full'
)

# 2. Extract Targets and Supports from RISK TAB and move to ADVISOR TAB
targets_start_html = '              {/* Targets and Supports */}'
idx_targets = content.find(targets_start_html)

# We need to find the end of Targets and Supports.
# It ends right before:
#               </div>
#             </div>
#           
#           {/* PLAN TAB */}
# OR wait, in my previous flawed extraction, I probably left it right before Plan Tab?
# Let's search for what's immediately after Targets and Supports.
# It's a grid div, then two children divs.
grid_end = '              </div>\n            </div>'

idx_grid_start = content.find('<div className="grid grid-cols-2 gap-4 mb-6">', idx_targets)
# Find the closing of this grid.
idx_grid_end = content.find('</div>', content.find('</div>', content.find('</div>', idx_grid_start + 1) + 1) + 1)
# Actually, the Targets block has two columns, each has multiple divs. It's complex to string-find exactly.
# Let's just find the start of PLAN TAB or RISK TAB end.
idx_plan_tab = content.find('{/* PLAN TAB */}')

# So the block starts at `idx_targets` and ends at `idx_plan_tab`.
# BUT wait! there are two closing `</div>` between Targets and PLAN TAB!
# Because Targets was inside RISK TAB!
# The RISK TAB ends like this:
#                 )}
# 
#               </div>
#             </div>
# 
#           {/* PLAN TAB */}

# Let's find exactly the text to extract.
# We will extract from idx_targets up to the first `</div>\n            </div>\n\n          {/* PLAN TAB */}`.
end_marker = '              </div>\n            </div>\n\n          {/* PLAN TAB */}'
idx_end_marker = content.find(end_marker, idx_targets)

if idx_targets != -1 and idx_end_marker != -1:
    targets_block = content[idx_targets:idx_end_marker]
    
    # Remove from current location
    content = content[:idx_targets] + content[idx_end_marker:]
    
    # Now insert into ADVISOR TAB!
    # ADVISOR TAB ends where RISK TAB begins.
    risk_tab_start = '{/* RISK TAB */}'
    idx_risk_tab = content.find(risk_tab_start)
    
    # We want to insert right before the `</div>\n          )}\n\n          {/* RISK TAB */}`
    insert_marker = '            </div>\n          )\}\n\n          {/* RISK TAB */}'
    # wait, regex or exact match
    idx_insert = content.rfind('            </div>', 0, idx_risk_tab)
    if idx_insert != -1:
        content = content[:idx_insert] + targets_block + "\n" + content[idx_insert:]
        print("Moved Targets to Advisor Tab")
    else:
        print("Could not find Advisor Tab end")
        sys.exit(1)
else:
    print("Could not find Targets block")
    sys.exit(1)

# 3. Remove "شراء إضافي" and "بيع جزئي" buttons (Quick Partial Transactions Row)
quick_row_start = '{/* Quick Partial Transactions Row */}'
idx_quick_start = content.find(quick_row_start)

# Find the end of this row block. It ends with:
#             </div>
#           )}
idx_quick_end = content.find('          )}\n', idx_quick_start)

if idx_quick_start != -1 and idx_quick_end != -1:
    # Just remove it completely
    content = content[:idx_quick_start] + content[idx_quick_end + 13:]
    print("Removed Quick Partial Row")

# 4. Remove `space-y-6` from the main Left Column flex block so gaps are precise
content = content.replace(
    'flex-col justify-between space-y-6 shadow-sm',
    'flex-col justify-between shadow-sm'
)

# And add `mt-6` to `{/* Close Position (Full Exit) Section */}` to maintain its spacing at the bottom
content = content.replace(
    '<div className="pt-4 border-t border-slate-200 dark:border-slate-800">',
    '<div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">'
)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixes applied")
