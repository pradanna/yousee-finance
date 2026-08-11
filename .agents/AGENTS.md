# Yousee Finance - Agent Rules

## Tech Stack Overview
- **Backend**: Laravel
- **Frontend**: Inertia.js (Bridge) + Vue.js/React.js
- **Styling**: Tailwind CSS (Default for modern Laravel)

## General Guidelines
- Always prioritize readable, maintainable, and clean code.
- Write code that follows modern best practices for both Laravel and the chosen frontend framework.
- Ensure that every change keeps performance, security, and scalability in mind, especially for a financial system.
- **Language Policy**:
  - All new `Rules` and `Skills` files MUST be written in **English** to ensure optimal comprehension by the AI agent.
  - All conversational responses and direct communication with the USER MUST be in **Indonesian**.

## Business Domain & Ubiquitous Language
> **CONDITIONAL TRIGGER - DOMAIN**: Jika ada tugas yang berkaitan dengan logika bisnis, penamaan entitas, atau struktur data, SEBELUM menulis kode apa pun, KAMU WAJIB MUTLAK menggunakan tool `view_file` untuk membaca file berikut:
> - [Domain Dictionary](rules/domain-dictionary.md)

## Backend (Laravel) Rules
> **CONDITIONAL TRIGGER - BACKEND**: JIKA user meminta pembuatan atau modifikasi fitur Backend (Model, Controller, Action, Migration, dll), **STOP!** Sebelum kamu menulis kode atau merancang plan apa pun, kamu **WAJIB MUTLAK menggunakan tool `view_file`** pada file-file berikut. Dilarang keras menggunakan asumsi arsitektur default Laravel:
> - [Backend Architecture Rules](rules/backend/architecture.md)
> - [Backend Naming Conventions](rules/backend/naming-conventions.md)
> - [Backend Best Practices](rules/backend/best-practices.md)

## Frontend (React + TypeScript + Inertia) Rules
> **CONDITIONAL TRIGGER - FRONTEND**: JIKA user meminta pembuatan atau modifikasi antarmuka Frontend (React + TypeScript + Inertia), **STOP!** Sebelum menulis kode atau merancang plan apa pun, kamu **WAJIB MUTLAK menggunakan tool `view_file`** pada file-file berikut:
> - [Frontend Architecture Rules](rules/frontend/architecture.md)
> - [Frontend State Management](rules/frontend/state-management.md)
> - [Frontend Naming Conventions](rules/frontend/naming-conventions.md)
> - [Frontend Routing (Inertia + Ziggy)](rules/frontend/routing.md)
> - [Design System & UI Rules](rules/frontend/design-system.md)

## Team Collaboration & API Contracts
> **CONDITIONAL TRIGGER - COLLABORATION**: JIKA tugas melibatkan penyambungan data antara FE dan BE (API Response/Props), SEBELUM menulis kode apa pun, KAMU WAJIB MUTLAK menggunakan tool `view_file` untuk membaca:
> - [Collaboration & CDC Rules](rules/collaboration.md)

## Testing & Visual Verification
- **STRICT RULE**: AI Agents are FORBIDDEN from using `browser_subagent` or visual browser tools to test the UI. All visual verifications must be done MANUALLY by the USER. 
- AI must rely purely on automated tests for backend verification.
- **Testing Standard**: The default testing framework for this project is **PHPUnit**. Do not use Pest syntax unless Pest is explicitly installed and requested by the user.

## Git & Workflow
- Make atomic, descriptive commits.
- Before making significant architectural changes, always propose a plan.
- **Automated Commit Workflow**: When the USER types `/commit`, you MUST execute the steps defined in [Commit Workflow](workflows/commit.md) and utilize the `domain-driven-commit` skill.
