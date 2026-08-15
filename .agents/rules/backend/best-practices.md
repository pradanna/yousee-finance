# Backend Best Practices (Security, Reliability & Typing)

As a financial application, strict adherence to security, data integrity, and strict typing is mandatory to prevent data loss or manipulation.

## 1. Security & Authorization
- **No Insecure Direct Object Reference**: Never allow endpoints to manipulate or retrieve data solely based on an ID without verifying user ownership.
- **Mandatory Policies**: Every Action or Controller endpoint that modifies or retrieves user-specific data MUST authorize the request using Laravel Policies or Gates (e.g., `$this->authorize('update', $wallet)`).
- **Mass Assignment Protection**: Never use `$request->all()` when creating or updating models. Explicitly define the fields to be saved, or use strictly validated Data Transfer Objects (DTOs) and `$request->validated()`.

## 2. Reliability & Database Integrity
- **Database Transactions (CRITICAL)**: Any operation that involves modifying financial balances, transferring funds, or executing multiple dependent write queries MUST be wrapped in a `DB::transaction()`. If any step fails, the entire transaction must roll back.
  ```php
  DB::transaction(function () use ($data) {
      // 1. Create transaction record
      // 2. Update wallet balance
  });
  ```
- **Audit Logging**: Any critical financial movement MUST be logged using Laravel's `Log` facade (e.g., `Log::info('Funds deducted', ['wallet_id' => $id, 'amount' => $amount])`) to maintain a trace/audit trail.

## 3. Strict Typing & Code Quality
- **Strict Types Declaration**: Every new PHP file MUST declare strict types at the very top of the file:
  ```php
  <?php
  
  declare(strict_types=1);
  ```
- **Explicit Type Hinting**: 
  - Every function/method MUST have explicitly defined parameter types.
  - Every function/method MUST have a defined return type.
  - Example: `public function execute(TransactionData $data): Transaction`
- **Avoid Untyped Arrays**: Refrain from using generic untyped arrays for complex data structures passing through Actions. Prefer typed DTOs.

## 4. Performance & Query Optimization
- **N+1 Prevention (CRITICAL)**: Always use Eager Loading (`with()`, `load()`) when fetching relations that will be iterated over. Never trigger lazy-loaded relationship queries inside a loop.
- **DRY Principle for Queries**: If a specific query filtering logic or calculation is used in multiple places, extract it into a **Local Scope** on the Eloquent Model. Do not duplicate raw query builder logic across multiple Actions or Controllers.
- **Chunking Large Datasets**: When processing a large number of database records (e.g., generating monthly financial reports or bulk processing), always use `chunk()` or `cursor()` to prevent memory exhaustion.


## 5. Database & Migration Specifics
- **Primary Keys (CRITICAL)**: ALL tables MUST use UUID as primary key, never auto-increment integers.
  - Migration: `$table->uuid('id')->primary();` (NOT `$table->id()`).
  - Model: use the `HasUuids` trait (`Illuminate\Database\Eloquent\Concerns\HasUuids`) so IDs are generated on creation.
  - Foreign keys referencing another table MUST be `$table->foreignUuid('x_id')->constrained(...)`, matching the UUID type of the referenced table's `id`.
  - Rationale: avoids sequential ID enumeration/IDOR exposure on a financial system and keeps ID generation consistent across all domains (already the pattern used by `users`).
- **Table Names**: `snake_case` plural.
- **Fiscal Mode**: Column type must be `string` ('ppn' or 'non-ppn').
- **Soft Deletes**: All major Aggregates (Vendor, Client) MUST use `softDeletes()`. Hard deletes are forbidden if transaction relations exist.
- **Constraints**: Always add `unique(['month', 'year', 'fiscal_mode'])` to the `closing_periods` table.
- **Monetary Columns**: MUST be `decimal(15, 2)`. Never use `float`.
