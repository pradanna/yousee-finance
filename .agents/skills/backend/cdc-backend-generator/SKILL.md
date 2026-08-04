---
name: cdc-backend-generator
description: Consumer-Driven Contract (CDC) backend generator. Triggers when asked to scan a frontend component (Vue/React) and automatically build the corresponding Backend scaffolding (Actions, Requests, Resources) based on the frontend's requirements.
---

# CDC Backend Generator (Frontend-Driven Scaffolding)

When the user asks to build or sync the backend based on a ready frontend component, you MUST follow this Consumer-Driven Contract (CDC) workflow. Your goal is to shape the Backend to perfectly serve the Frontend's needs (BFF pattern) using our Lite DDD architecture.

## Step 1: Scan and Analyze the Frontend
Use your file viewing/searching tools to analyze the designated frontend component (Vue/React) provided by the user.
1. **Identify the Input (Contract from FE -> BE):**
   - Look for form submissions, Inertia `useForm` definitions, or Axios/Fetch payloads.
   - Note the exact field names and expected data types. This will dictate the **Form Request** rules.
2. **Identify the Output (Contract from BE -> FE):**
   - Look at the `props` defined in the component (if using Inertia) or the expected JSON response shape.
   - Note the exact variable names the UI expects to render. This will dictate the **API Resource** structure.
3. **Identify the Endpoints & Intent:**
   - Look at the routes being called (e.g., `route('transaction.store')`).
   - Determine the business intent (e.g., is this a generic update, or a specific process like "Refund"?).

## Step 2: Plan the Scaffolding
Map the frontend findings to our Lite DDD architecture:
- **Action**: What specific task is being performed? (e.g., `app/Domains/Transaction/Actions/ProcessRefund.php`).
- **Form Request**: Map the frontend inputs to strict Laravel validation rules.
- **API Resource**: Map the backend data to match the exact `props` expected by the frontend.

## Step 3: Scaffold the Backend
Create the necessary files, strictly following the rules in `rules/backend/architecture.md` and `rules/backend/naming-conventions.md`.
- Ensure the Controller is thin and only bridges the Request to the Action.
- Ensure the API Resource returns *exactly* what the frontend component requested, no more, no less (preventing data leaks).

## Step 4: Verification
Verify that the newly created Form Request keys match the frontend form fields perfectly, and the API Resource keys match the frontend props perfectly.
