---
name: scaffold-react-feature
description: Scaffold a new React frontend feature using the Feature-Based Design (FSD) structure. Trigger when asked to create a new UI feature, page, or domain module in the frontend.
---

# Scaffold React Feature (Feature-Based Design)

When asked to create a new frontend feature, you MUST follow this Standard Operating Procedure to maintain the Feature-Based Design architecture.

## Step 1: Create the Feature Directory
All feature-specific logic goes into `resources/js/Features/<FeatureName>/`. Create the following structure:
- `resources/js/Features/<FeatureName>/Components/`
- `resources/js/Features/<FeatureName>/Hooks/`
- `resources/js/Features/<FeatureName>/types.ts`

## Step 2: Scaffold the Types
In `types.ts`, define the TypeScript interfaces that mirror the backend DTOs or API Resources for this feature.

## Step 3: Scaffold the Components
Create the React components (using `.tsx` and PascalCase) inside the `Components/` folder.
- Ensure they are Functional Components.
- Ensure `Props` are strongly typed using the interfaces from `types.ts`.

## Step 4: Scaffold the Inertia Page
Create the entry point Page component in `resources/js/Pages/<FeatureName>/Index.tsx`.
- The Page component should import and compose the feature components.
- Wrap the page in the appropriate layout (e.g., `<AuthenticatedLayout>`).
