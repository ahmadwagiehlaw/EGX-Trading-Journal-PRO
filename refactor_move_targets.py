# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Find the Targets and Supports block
start_marker = '{/* Targets and Supports */}'
# The block ends right before '{/* Smart Trailing Stop Tools */}'
end_marker = '{/* Smart Trailing Stop Tools */}'

idx_start = content.find(start_marker)
idx_end = content.find(end_marker)

if idx_start != -1 and idx_end != -1:
    targets_block = content[idx_start:idx_end]
    
    # Remove from its current place in the 'plan' tab
    content = content[:idx_start] + content[idx_end:]
    
    # 2. Insert it into the 'advisor' tab
    # Find the end of the advisor tab content.
    # The advisor tab is defined as:
    # {leftTab === 'advisor' && (
    #   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    #     ... smart insights ...
    #   </div>
    # )}
    
    advisor_tab_start = "{/* ADVISOR TAB */}"
    notes_tab_start = "{/* NOTES TAB */}"
    
    idx_advisor = content.find(advisor_tab_start)
    idx_notes = content.find(notes_tab_start)
    
    if idx_advisor != -1 and idx_notes != -1:
        # Find the last </div> before NOTES TAB
        idx_advisor_end = content.rfind("</div>", idx_advisor, idx_notes)
        if idx_advisor_end != -1:
            # We want to insert the targets block INSIDE the advisor's animate-in div.
            # Wait, idx_advisor_end is the closing of the `animate-in` div!
            # So we insert BEFORE idx_advisor_end.
            
            # Let's verify by just injecting it right before idx_advisor_end
            content = content[:idx_advisor_end] + "\n              " + targets_block + "\n            " + content[idx_advisor_end:]
            
            with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
                f.write(content)
            print("Successfully moved Targets and Supports to Advisor tab")
        else:
            print("Could not find closing div for advisor tab")
    else:
        print("Could not find advisor or notes tab")
else:
    print("Could not find targets block")

