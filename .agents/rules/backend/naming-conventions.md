# Backend Naming Conventions

This project strictly follows PSR-12 standards and Laravel's idiomatic naming conventions, adapted for our Lite DDD architecture. Consistent naming is critical for code readability and maintainability.

## 1. Directories (Folders)
- **Default Laravel / Namespaces**: Always use `PascalCase` (e.g., `app/Http/Controllers`).
- **Domain Folders**: Use `PascalCase` and **Singular** form for the domain name itself.
  - ✅ `app/Domains/Transaction/`
  - ❌ `app/Domains/Transactions/`
- **Domain Sub-folders**: Use **Plural** form for the internal structural folders.
  - ✅ `Models`, `Actions`, `Enums`, `DataTransferObjects`.

## 2. Files & Classes
Class names must always be `PascalCase` and the file name must perfectly match the class name.
- **Models**: **Singular** form, no suffix.
  - ✅ `Transaction.php`, `Wallet.php`
- **Controllers**: Must have the `Controller` suffix.
  - ✅ `TransactionController.php`
- **Form Requests**: Must have the `Request` suffix, typically prefixed with the HTTP action.
  - ✅ `StoreTransactionRequest.php`, `UpdateWalletRequest.php`
- **Actions**: Use `VerbNoun` format. The `Action` suffix is omitted to allow natural reading when called (e.g., `app(CreateTransaction::class)`).
  - ✅ `CreateTransaction.php`, `CalculateWalletBalance.php`
- **Data Transfer Objects (DTOs)**: Must have the `Data` or `DTO` suffix.
  - ✅ `TransactionData.php`
- **Enums**: Must have a descriptive suffix like `Type` or `Status`.
  - ✅ `TransactionType.php`, `PaymentStatus.php`
- **Traits**: Should be an adjective or start with `Has` / `Is`.
  - ✅ `HasTransactions.php`, `IsPayable.php`

## 3. Database (Tables & Columns)
Laravel relies heavily on database conventions for Eloquent to work automatically.
- **Main Tables**: `snake_case` and **Plural**.
  - ✅ `transactions`, `wallets`, `user_profiles`
- **Pivot Tables**: `snake_case`, **Singular**, and sorted alphabetically by model names.
  - ✅ `transaction_wallet` (not `wallet_transaction`)
- **Columns & Foreign Keys**: `snake_case`. Foreign keys must be the singular table name + `_id`.
  - ✅ `wallet_id`, `created_at`, `total_amount`

## 4. PHP Variables & Methods
- **Variables & Class Properties**: `camelCase`.
  - ✅ `$transactionData`, `$totalAmount`
- **Methods**: `camelCase`.
  - ✅ `calculateTotal()`, `getLatestTransaction()`
