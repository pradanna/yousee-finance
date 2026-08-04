# Frontend Naming Conventions (React + TypeScript)

Consistent naming is critical for finding components and types easily.

## 1. Files and Directories
- **React Components & Pages**: Use `PascalCase`. The filename must exactly match the default export component name.
  - ✅ `TransactionList.tsx`, `Dashboard.tsx`
- **Utility Files & Hooks**: Use `camelCase`.
  - ✅ `formatCurrency.ts`, `useCalculateTotal.ts`

## 2. React Components
- Component names must be `PascalCase`.
- Use descriptive names. Avoid generic names like `List.tsx`, prefer `TransactionList.tsx`.

## 3. TypeScript Interfaces & Types
- **Props**: Suffix with `Props` (e.g., `TransactionFormProps`).
- **Backend Models/Resources**: Mirror the backend naming without prefixes. (e.g., interface `Transaction`).
- **Avoid 'I' Prefix**: Do not use the `I` prefix for interfaces (e.g., use `User`, not `IUser`).

## 4. Hooks and Variables
- **Custom Hooks**: Must start with `use` and follow `camelCase` (e.g., `useTransactionModal`).
- **Event Handlers**: 
  - Prop names should start with `on` (e.g., `onSubmit`, `onRowClick`).
  - Implementation functions should start with `handle` (e.g., `handleSubmit`, `handleRowClick`).
- **Booleans**: Prefix with `is`, `has`, or `should` (e.g., `isOpen`, `hasErrors`).
