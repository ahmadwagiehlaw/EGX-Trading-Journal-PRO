# -*- coding: utf-8 -*-
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_str = '''import Dashboard from './components/Dashboard';'''
new_import_str = '''import Dashboard from './components/Dashboard';
import StickyNotesPanel from './components/StickyNotesPanel';
import { Pin } from 'lucide-react';'''
content = content.replace(import_str, new_import_str)

state_str = '''  const [isSidebarOpen, setIsSidebarOpen] = useState(false);'''
new_state_str = '''  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);'''
content = content.replace(state_str, new_state_str)

fab_str = '''    </>
  );
}'''
new_fab_str = '''      <button 
        onClick={() => setIsNotesOpen(true)}
        className=\"fixed bottom-6 right-6 z-40 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-110 flex items-center justify-center\"
        title=\"ملاحظات وأفكار\"
      >
        <Pin className=\"w-6 h-6\" />
      </button>

      <StickyNotesPanel isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </>
  );
}'''

# Replace only the LAST occurrence of     </>\n  );\n}
idx = content.rfind('    </>\n  );\n}')
if idx != -1:
    content = content[:idx] + new_fab_str

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Added FAB')
