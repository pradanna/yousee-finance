# Team Collaboration & API Contracts

Because the Frontend (FE) and Backend (BE) teams are decoupled, we rely on **Contracts** to ensure seamless integration.

## Consumer-Driven Contracts (CDC) Workflow

Whenever FE needs data from BE, or BE provides new functionality to FE, a written contract MUST be established using Markdown.

1. **Location**: All integration contracts must be placed inside the `docs/contracts/` directory.
2. **Provider-Driven (Backend First)**:
   - If the Backend team implements a feature first (e.g., Auth endpoints), they must create a contract in `docs/contracts/BE/<feature-name>.md`.
   - The contract must outline the endpoints, expected request payloads, and the exact JSON or Inertia Prop response structures (including validation error formats).
3. **Consumer-Driven (Frontend First)**:
   - If the Frontend team starts building the UI first using mock data, they should define the exact JSON/Props structure they need from the Backend.
   - They must write a contract and place it in `docs/contracts/FE/<feature-name>.md`.
   - The Backend team is then responsible for fulfilling this contract exactly as specified.

By strictly adhering to these contract locations, both teams and AI Agents can easily discover integration requirements by reading the markdown files in `docs/contracts/`.
