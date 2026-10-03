# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the flex justify-between
old_header_start = """            {/* Header / Ticker Summary */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>"""

new_header_start = """            {/* Header / Ticker Summary */}
            <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex justify-between items-start mb-4">
                <div>"""

content = content.replace(old_header_start, new_header_start)

# Now, we need to extract the [Quantity] block and move it up, 
# because it is currently AFTER the Pills block.

quantity_block_start = '              <div className="text-left">'
quantity_block_end = '              </div>\n            </div>'

idx_qty_start = content.find(quantity_block_start)
idx_qty_end = content.find(quantity_block_end, idx_qty_start)

if idx_qty_start != -1 and idx_qty_end != -1:
    quantity_block = content[idx_qty_start:idx_qty_end + len('              </div>')]
    
    # Remove it from its current position
    content = content[:idx_qty_start] + content[idx_qty_end + len('              </div>\n            </div>'):]
    
    # We also removed the closing `</div>` of the main Header block (`</div>\n            </div>`).
    # Wait, the `quantity_block_end` had `            </div>`. We need to keep that for the end of the entire Header block.
    # Actually, let's just do targeted replacements.
    
    # Find where to inject the quantity block (right before the Pills start).
    pills_start = '                <div className="flex flex-wrap items-center gap-2">'
    idx_pills = content.find(pills_start)
    if idx_pills != -1:
        # Inject quantity block here, closing the inner flex block!
        content = content[:idx_pills] + quantity_block + '\n              </div>\n\n' + content[idx_pills:]
        
        # Now change the Pills container
        content = content.replace(
            '<div className="flex flex-wrap items-center gap-2">',
            '<div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">'
        )
        
        # And we need to add the closing `</div>` for the main Header block, since we removed it...
        # Wait, did we? I removed `content[:idx_qty_start] + content[idx_qty_end + ...]`
        # Let's just be very precise.
        pass
