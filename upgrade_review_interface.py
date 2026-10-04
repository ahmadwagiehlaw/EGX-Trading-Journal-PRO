# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_interface = """export interface WeeklyReview {
  id: string;
  weekStartDate: number;
  weekEndDate: number;
  pnl: number;
  winRate: number;
  tradesCount: number;
  openedCount?: number;
  closedCount?: number;
  whatWentWell: string;
  whatWentWrong: string;
  focusNextWeek: string;
  createdAt: number;
}"""

new_interface = """export interface WeeklyReview {
  id: string;
  weekStartDate: number;
  weekEndDate: number;
  pnl: number;
  winRate: number;
  tradesCount: number;
  openedCount?: number;
  closedCount?: number;
  whatWentWell: string;
  whatWentWrong: string;
  focusNextWeek: string;
  disciplineScore?: number;
  marketCondition?: 'bull' | 'bear' | 'sideways' | 'volatile';
  createdAt: number;
}"""

content = content.replace(old_interface, new_interface)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated interface")
