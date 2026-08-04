---
name: domain-driven-commit
description: Git commit strategist that enforces atomic, domain-driven commit messages. Trigger when asked to commit changes to the repository, or when executing a git workflow.
---

# Domain-Driven Commit Strategist

To maintain a clean and traceable project history that aligns with our Lite DDD architecture, you MUST follow these strict rules when performing `git commit` operations.

## 1. Never Blindly Add All Files
- **Rule**: NEVER run `git add .` or `git commit -a` without verifying the changes first.
- **Action**: Always run `git status` and `git diff` first to understand what has changed.

## 2. Atomic & Domain-Specific Commits
- **Rule**: A single commit should only contain changes related to ONE specific domain or feature context.
- **Action**: If you modified files across multiple domains (e.g., you updated a `Billing` Invoice Model AND an `Accounting` Journal Entry Model), you MUST split them into **two separate commits**.
  - Example Step 1: `git add app/Domains/Billing/Models/Invoice.php` -> `git commit ...`
  - Example Step 2: `git add app/Domains/Accounting/Models/JournalEntry.php` -> `git commit ...`

## 3. Commit Message Format (Conventional Commits + Changelog)
- **Format**: Every commit MUST have a title and a detailed body (changelog).
  - Use `git commit -m "type(domain_scope): short description" -m "Changelog: - detail 1 - detail 2"`
- **Types**:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `refactor`: Code change that neither fixes a bug nor adds a feature
  - `chore`: Build process, dependencies, or configuration changes (like `.agents/` updates)
  - `test`: Adding missing tests or correcting existing tests
- **Domain Scope**: The scope MUST be the specific Domain name or a high-level context.
  - Backend Scopes: `identity`, `master`, `procurement`, `billing`, `accounting`, `shared`, `core`
  - Frontend Scopes: `frontend`, `ui`, `components`
- **Description & Changelog**: 
  - The title must be in lowercase, imperative mood (e.g., "add kwitansi generator").
  - The body (second `-m` flag) MUST contain a bulleted list of the exact changes made in this commit to make tracking easy.

## Examples of PERFECT Commits
- `feat(billing): auto-generate kwitansi on invoice paid`
- `fix(procurement): prevent po creation in closed period`
- `refactor(accounting): optimize journal entry balancing check`
- `feat(frontend): scaffold transaction data table with pagination`
- `chore(core): setup domain dictionary and ai agent rules`
