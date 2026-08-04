---
name: tailwind-finance-ui
description: Design premium, finance-focused UI components using Tailwind CSS. Trigger when asked to design a component, table, card, or improve the aesthetics of a page.
---

# Finance UI & Tailwind Crafter

Financial applications require a high level of trust, which is communicated through a premium, clean, and highly readable UI.

## Step 1: Financial Formatting
- **Currency**: Always format monetary values using `Intl.NumberFormat` or a dedicated formatting utility.
- **Color Coding**: 
  - Use semantic colors strictly: Green (e.g., `text-emerald-600`) for Income/Positive balances. Red (e.g., `text-rose-600`) for Expenses/Negative balances.

## Step 2: Component Design (Tailwind)
- **Cards**: Use clean borders, subtle shadows (`shadow-sm`, `shadow-md`), and rounded corners (`rounded-xl` or `rounded-2xl`).
- **Data Tables**: Ensure data tables are responsive. Align numbers/currency to the right. Align text to the left.
- **Empty States**: Always design a beautiful empty state (e.g., "No transactions yet") with a subtle icon and muted text.

## Step 3: Interaction & Feedback
- Add micro-interactions: subtle hover effects on buttons and table rows (e.g., `hover:bg-gray-50 transition-colors`).
- Ensure all clickable elements have distinct focus states for accessibility (`focus:ring`).
