# -*- coding: utf-8 -*-
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''            <Dashboard 
              onOpenTradingDesk={handleOpenTradingDesk} 
              onNavigate={setActiveTab}
            />'''

new_str = '''            <Dashboard 
              onOpenTradingDesk={handleOpenTradingDesk} 
              onNavigate={setActiveTab}
              onOpenTrade={(id) => {
                setActiveTradeId(id);
                setActiveTab('سجل الصفقات');
              }}
            />'''

content = content.replace(old_str, new_str)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated App.tsx')
