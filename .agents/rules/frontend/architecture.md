# Frontend Architecture Rules (React + TypeScript + Inertia)

This project uses React with TypeScript and Inertia.js. The frontend architecture must maintain a clear separation between Pages, UI Components, and Layouts.

## 1. Directory Structure (Feature-Based Design)
To mirror our backend's Lite DDD architecture, the frontend MUST use a Feature-Based structure (a simplified version of Feature-Sliced Design) rather than grouping all files globally by type.

- `resources/js/Pages/`: Contains full page components (Inertia entry points). This must remain at the root for Inertia's routing system to work automatically. Pages should mostly act as shells that compose Feature components.
- `resources/js/Features/<FeatureName>/`: This is the frontend equivalent of Backend Domains. Group specific business concerns here. Inside a feature (e.g., `Transaction`), you should have:
  - `Components/`: UI components specific to this feature (e.g., `TransactionList.tsx`, `TransactionForm.tsx`).
  - `Hooks/`: Custom React hooks specific to this feature (e.g., `useTransactionModal.ts`).
  - `types.ts`: TypeScript definitions mirroring the backend DTOs/Resources for this feature.
- `resources/js/Components/`: Contains ONLY global, reusable, "dumb" UI components that are completely agnostic to business logic (e.g., `Button.tsx`, `Modal.tsx`, `TextInput.tsx`).
- `resources/js/Layouts/`: Contains global layout wrappers (e.g., `AuthenticatedLayout.tsx`) that maintain state across page navigations.
- `resources/js/types/`: Contains ONLY truly global TypeScript interfaces (like the global `User` object, Inertia `PageProps`, or standard pagination types).

## 2. Component Design (Functional & Typed)
- **Core Rule**: Use Functional Components exclusively. Do NOT use Class Components.
- **Strict TypeScript (CRITICAL)**: The use of the `any` type is STRICTLY FORBIDDEN. You must define precise interfaces, generic types, or use `unknown` if the type is truly unknowable before validation. A finance app cannot afford type uncertainty.
- **Null Safety**: You MUST use Optional Chaining (`?.`) and Nullish Coalescing (`??`) when accessing deeply nested properties or potentially nullable data from the Backend API to prevent "cannot read property of undefined" crashes.
- **Type Safety**: Every component MUST have its `Props` strictly typed using TypeScript interfaces.
  ```tsx
  interface TransactionCardProps {
      transaction: Transaction;
      onEdit: (id: number) => void;
  }
  ```
- **Separation of Concerns**: `Pages` can be smart (fetch data, manage complex state, interact with Inertia router), but `Components` should ideally be "dumb" (rely on props and emit events via callbacks).

## 3. Styling (Tailwind CSS)
- Use Tailwind CSS utility classes for styling.
- Do not create custom `.css` files unless absolutely necessary for complex animations or global base variables.
- Extract highly reused combinations of utility classes into base React components (e.g., creating a `<PrimaryButton>` component instead of repeating standard button classes).

## 4. Code Formatting & Linter Strictness
- **Prettier Standard**: All generated code MUST strictly follow the project's Prettier configuration. Pay close attention to indentation, trailing commas, quote styles, and line length.
- **Tailwind CSS Best Practices**: 
  - ALWAYS use the official Tailwind CSS class sorting order (e.g., layout -> spacing -> typography -> visual -> modifiers).
  - Use established project design tokens and utility classes over raw CSS or inline styles.
- **Zero Linter Warnings Policy**: 
  - You are FORBIDDEN from generating code that produces ESLint, Prettier, or TypeScript compilation errors/warnings.
  - Pay close attention to React hook dependency arrays (`eslint-plugin-react-hooks`), unused variables, and `any` types.
  - If a linter error is unavoidable, you MUST explicitly provide a valid bypass comment (e.g., `// eslint-disable-next-line`) along with a short justification, though this should be a last resort.
- **Line Endings (LF)**: All files MUST use Unix-style line endings (`LF` / `\n`). Windows line endings (`CRLF` / `\r\n`) are strictly forbidden as they trigger Prettier `Delete ␍` lint warnings. Always ensure files are saved with LF line endings or formatted via Prettier (`npx prettier --write`).
- **Verification**: Double-check for missing imports, incorrect prop types, and potentially null variables (e.g., always use type guards or optional chaining `?.`) before outputting code.
