# -*- coding: utf-8 -*-
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_fab = 'className="fixed bottom-6 right-6 z-40 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-110 flex items-center justify-center"'
new_fab = 'className="fixed bottom-40 left-4 md:bottom-28 md:left-8 z-40 p-3.5 md:p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"'

content = content.replace(old_fab, new_fab)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Moved FAB to the left!")
