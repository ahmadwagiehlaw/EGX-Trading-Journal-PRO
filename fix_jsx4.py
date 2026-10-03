# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = """          </div>
        </div>
  
        {/* Partial Transaction Modal */}"""

good_str = """          </div>
        </div>
      </div>
  
      {/* Partial Transaction Modal */}"""

content = content.replace(bad_str, good_str)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected missing div")
