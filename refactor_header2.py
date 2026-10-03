# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change the main flex wrapper
content = content.replace(
    """            {/* Header / Ticker Summary */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>""",
    """            {/* Header / Ticker Summary */}
            <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex justify-between items-start mb-4">
                <div>"""
)

# 2. Find the Quantity block
qty_start = '              <div className="text-left">'
qty_end = '              </div>\n            </div>'

idx_qty = content.find(qty_start)
idx_qty_end = content.find(qty_end, idx_qty)

if idx_qty != -1 and idx_qty_end != -1:
    qty_block = content[idx_qty:idx_qty_end + len('              </div>')]
    
    # Remove it from the end
    content = content[:idx_qty] + content[idx_qty_end + len('              </div>\n            </div>'):]
    
    # 3. Find the Pills block
    pills_start = '                <div className="flex flex-wrap items-center gap-2">'
    idx_pills = content.find(pills_start)
    
    if idx_pills != -1:
        # We need to insert the qty_block before the pills, and close the flex container
        insertion = "                </div>\n" + qty_block + "\n              </div>\n\n"
        # BUT wait! The old code had:
        # <div>
        #   [Symbol]
        #   [Avg Entry]
        #   [Pills]
        # </div>
        # So we need to close the `<div>` holding Symbol+Avg Entry!
        # The insertion above does EXACTLY that. `</div>` closes the left wrapper, then qty_block, then `</div>` closes the flex container!
        
        # We replace the pills_start with grid
        new_pills_start = '              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">'
        
        content = content[:idx_pills] + insertion + new_pills_start + content[idx_pills + len(pills_start):]
        
        # 4. Add the final closing div for the Header block
        # Since we removed `</div>\n            </div>` from the very end, we just need to append ONE `</div>` after the Pills block!
        # The Pills block ends before `{/* TABS HEADER */}` (or where the raw alerts used to be).
        # We just find `          </div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}` and we don't need to do anything because that ALREADY closes the main block!
        # Wait, if we removed ONE `</div>` (because the other was for the `flex justify-between` which is now just `<div className="mb-6...">`), we need to make sure the tags are balanced.
        
        # Let's count tags for the new structure:
        # <div className="mb-6 ...">
        #   <div className="flex justify-between ...">
        #     <div>
        #       [Symbol]
        #       [Avg Entry]
        #     </div>
        #     [Quantity Block]
        #   </div>
        #   <div className="grid ...">
        #     [Pills]
        #   </div>
        # </div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}
        
        # This is PERFECT! It is exactly balanced!
        
        with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully refactored header.")
    else:
        print("Could not find Pills.")
else:
    print("Could not find Quantity block.")

