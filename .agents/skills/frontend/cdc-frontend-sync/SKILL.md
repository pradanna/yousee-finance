---
name: cdc-frontend-sync
description: Consumer-Driven Contract sync tool. Synchronizes Frontend TypeScript types and Zod schemas with Backend API Resources and FormRequests. Trigger when asked to sync frontend types with the backend.
---

# CDC Frontend Sync (Types & Zod)

To maintain our Lite DDD architecture and prevent runtime errors, the Frontend contracts (Types & Zod schemas) must perfectly match the Backend contracts (API Resources & Form Requests).

## Step 1: Scan the Backend
Use your file viewing/searching tools to analyze the relevant backend files:
- **API Resource** (`app/Http/Resources/`): Identifies the exact shape of the JSON returned to the frontend.
- **Form Request** (`app/Http/Requests/`): Identifies the exact payload the backend expects, including validation rules (e.g., `min`, `max`, `required`).

## Step 2: Sync TypeScript Interfaces
Locate the corresponding `types.ts` file in the frontend (`resources/js/Features/<FeatureName>/types.ts` or `resources/js/types/`).
- Update the TypeScript `interface` to perfectly match the keys and data types returned by the Backend API Resource.

## Step 3: Sync Zod Schemas
Locate the corresponding React component or Hook that contains the Zod schema.
- Update the `z.object({})` definition to match the validation rules found in the Backend Form Request.
- Ensure the frontend Zod schema is slightly *stricter* or equal to the backend, never looser.

## Step 4: Verification
Confirm that no TypeScript errors are introduced in the related components due to the type changes.
