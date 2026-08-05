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
> **CRITICAL**: Untuk memahami konteks bisnis dan kamus istilah (Ubiquitous Language) dalam sistem YouSee Finance, kamu **WAJIB** membaca file berikut sebelum menamai variabel, fungsi, atau model:
> - [Domain Dictionary](rules/domain-dictionary.md)

## Backend (Laravel) Rules
> **CRITICAL**: Untuk semua tugas terkait Backend (Laravel), kamu **WAJIB** membaca dan mengikuti file panduan berikut:
> - [Backend Architecture Rules](rules/backend/architecture.md)
> - [Backend Naming Conventions](rules/backend/naming-conventions.md)
> - [Backend Best Practices](rules/backend/best-practices.md)

## Frontend (React + TypeScript + Inertia) Rules
> **CRITICAL**: Untuk semua tugas terkait Frontend, kamu **WAJIB** membaca dan mengikuti file panduan berikut:
> - [Frontend Architecture Rules](rules/frontend/architecture.md)
> - [Frontend State Management](rules/frontend/state-management.md)
> - [Frontend Naming Conventions](rules/frontend/naming-conventions.md)
> - [Frontend Routing (Inertia + Ziggy)](rules/frontend/routing.md)
> - [Design System & UI Rules](rules/frontend/design-system.md)

## Team Collaboration & API Contracts
> **CRITICAL**: Untuk kolaborasi FE dan BE, sistem menggunakan pola Consumer-Driven Contracts. **WAJIB** membaca file berikut:
> - [Collaboration & CDC Rules](rules/collaboration.md)

## Testing & Visual Verification
- **STRICT RULE**: AI Agents are FORBIDDEN from using `browser_subagent` or visual browser tools to test the UI. All visual verifications must be done MANUALLY by the USER. 
- AI must rely purely on automated tests for backend verification.
- **Testing Standard**: The default testing framework for this project is **PHPUnit**. Do not use Pest syntax unless Pest is explicitly installed and requested by the user.

## Git & Workflow
- Make atomic, descriptive commits.
- Before making significant architectural changes, always propose a plan.
- **Automated Commit Workflow**: When the USER types `/commit`, you MUST execute the steps defined in [Commit Workflow](workflows/commit.md) and utilize the `domain-driven-commit` skill.
