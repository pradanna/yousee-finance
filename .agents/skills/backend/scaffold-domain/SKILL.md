---
name: scaffold-domain
description: Scaffold a new domain feature or business process in the Laravel backend using Lite DDD (Action-Based) architecture. Trigger this when creating a new feature, CRUD, or specific business process (e.g., transferring funds, processing refunds).
---

# Scaffold Domain Feature (Lite DDD)

When asked to create a new feature, CRUD, or business process in the backend, you MUST follow this Standard Operating Procedure (SOP) to maintain the Action-Based (Lite DDD) architecture.

## Step 1: Analyze the Request
Determine if the request is a standard CRUD operation or a specific business process (e.g., "Transfer Money", "Process Refund").
- If **CRUD**: You will create standard actions (e.g., `Create[Model]`, `Update[Model]`, `Delete[Model]`).
- If **Specific Business Process**: You will create highly specific Action classes (e.g., `TransferMoney`, `RefundTransaction`). Do NOT force complex logic into generic `update` or `store` methods.

## Step 2: Create the Domain Structure
All business logic goes into `app/Domains/<DomainName>/`. If the domain doesn't exist, you must create the following directory structure:
- `app/Domains/<DomainName>/Models/`
- `app/Domains/<DomainName>/Actions/`
- `app/Domains/<DomainName>/Enums/` (if applicable)
- `app/Domains/<DomainName>/DataTransferObjects/` (if applicable)

## Step 3: Scaffold the Files
Generate the necessary files following the established naming conventions:
1. **Migration & Model**: Create the model inside `app/Domains/<DomainName>/Models/`. Use Eloquent Query Scopes for complex queries.
2. **Action Class(es)**: Create Single Responsibility classes in the `Actions` folder.
   - Must contain a single public method (e.g., `execute()` or `handle()`).
   - Must wrap financial or multi-table changes in `DB::transaction()`.
   - Must NOT contain HTTP logic (`request()`, `redirect()`).
3. **Form Request**: Use `php artisan make:request` to generate validation logic in `app/Http/Requests/`.
4. **API Resource**: Use `php artisan make:resource` to generate response formatting in `app/Http/Resources/`.
5. **Controller**: Create a thin controller in `app/Http/Controllers/`.
   - The controller's only job is to receive the validated Form Request, call the Action, and return an Inertia response (using the API Resource).

## Step 4: Register Routes & Policies
- Add the newly created endpoints to `routes/web.php`.
- Ensure endpoints are protected by Laravel Policies (e.g., `$this->authorize()`) to prevent insecure direct object references.

## Critical Reminders
- Always review `rules/backend/architecture.md` and `rules/backend/best-practices.md` before writing the code.
- Ensure strict typing (`declare(strict_types=1);`) is used in all new PHP files.
