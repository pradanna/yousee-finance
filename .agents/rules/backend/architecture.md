# Backend Architecture Rules (Lite DDD / Action-Based)

This project uses a "Lite DDD" (Action-Based) architecture to maintain a clean, scalable, and maintainable codebase, which is especially important for a financial system.

## 0. Database Schema Source of Truth
- **CONDITIONAL TRIGGER**: BEFORE writing or modifying any migration, you MUST use `view_file` to check `docs/databases/tables/<table_name>.dbml` if it exists.
- `docs/databases/` (one DBML file per table, see its `README.md`) is the authoritative design for the schema — table shape, columns, indexes, and the invariants behind them live in each table's `Note:` block.
- If a migration needs to diverge from its `.dbml` file, update the `.dbml` file in the SAME commit and re-run `docs/databases/build.sh`. A migration and its DBML file must never drift apart.
- If you are designing a NEW table that has no `.dbml` file yet, write the `.dbml` file first, then the migration.

## 1. Controllers (HTTP Entry Point)
- **Core Rule**: Controllers MUST be "Thin".
- **Responsibility**: Receive HTTP requests, validate input using Form Requests, call the appropriate Action class, and return a response (Inertia View or Redirect).
- **Constraints**: 
  - NO business logic is allowed in the Controller.
  - NO complex database queries (use Actions or Query Scopes).
  - NO `if/else` logic related to business rules.

## 2. Actions (Business Logic Hub)
- **Core Rule**: All business logic MUST reside in Action classes. They should be located in `app/Actions/` or grouped by domain in `app/Domains/<DomainName>/Actions/`.
- **Responsibility**: Perform a single, highly specific business task (e.g., `CreateTransaction`, `UpdateWalletBalance`).
- **Coding Rules**: 
  - Must adhere to the Single Responsibility Principle (SRP).
  - Should only have one primary public method (e.g., `execute()` or `handle()`).
- **Constraints**: Actions MUST NOT contain HTTP-specific code (such as the `request()` helper, `redirect()`, or returning Inertia responses). Actions must be callable from anywhere (Controllers, Console Commands, or Jobs).

## 3. Models & Database Layer
- **Core Rule**: Maximize the use of Eloquent ORM.
- **Responsibility**: Define relationships, casts, and Query Scopes.
- **Constraints**: DO NOT use the Repository Pattern. Utilize Query Scopes within the Model to encapsulate long or complex queries.
- **Financial Rules (CRITICAL)**: To store monetary values/balances, ALWAYS use `decimal` or `integer` data types (storing in cents/smallest unit) in the database. Never use `float` or `double` to avoid precision calculation issues.

<CRITICAL_RULES>
- **Model Placement**: ALL Models MUST be placed inside their respective domain folders: `app/Domains/<DomainName>/Models/<ModelName>.php`. DO NOT use the default `app/Models/` directory.
- **Factory Placement**: Factories MUST remain in the default `database/factories/` directory (e.g., `database/factories/VendorFactory.php`).
- **Factory Resolution**: Because Models are moved out of the default directory, Laravel's auto-discovery for factories will fail. Therefore, EVERY Model MUST explicitly define the `newFactory()` method to return its corresponding factory instance.
  Example:
  ```php
  protected static function newFactory()
  {
      return \Database\Factories\VendorFactory::new();
  }
  ```
  Additionally, the Factory class MUST define the `$model` property pointing to the correct Domain Model path:
  ```php
  protected $model = \App\Domains\Vendor\Models\Vendor::class;
  ```
</CRITICAL_RULES>

## 4. Validation, DTOs, & Enums
- **Core Rule**: Never trust client-side input.
- **Responsibility**: 
  - Use `Form Requests` (`app/Http/Requests`) to validate input *before* it reaches the Controller/Action.
  - **CRITICAL CONSTRAINT**: Form Requests MUST ONLY contain validation (`rules()`) and authorization (`authorize()`). STRICTLY NO business logic (e.g., `Auth::attempt()`, creating models, hitting RateLimiters directly for business flows) is allowed inside Form Requests. All execution logic must be deferred to the Action class.
  - Use PHP *Enums* for data types with fixed states (e.g., `TransactionType::INCOME`, `TransactionType::EXPENSE`).
  - (Optional but recommended) Use *Data Transfer Objects* (DTOs) to encapsulate data arrays sent to Actions to ensure type safety.

## 5. Responses & API Resources (Inertia Paradigm)
- **Core Rule**: Never pass raw Eloquent Models directly to the frontend (Inertia). Use Laravel API Resources (`app/Http/Resources/`) instead.
- **Anti-Pattern (CRITICAL)**: DO NOT construct custom REST API Base Response wrappers (e.g., `{"code": 200, "status": "success", "data": ...}`). This is a severe anti-pattern for Inertia.js.
  - HTTP status codes are handled natively by the browser/XHR.
  - Validation errors are handled automatically by Laravel Form Requests via 422 redirects (Inertia injects these into `useForm().errors`).
  - General success/error notifications must be handled via Laravel Session Flashing (e.g., `redirect()->back()->with('success', 'Done')`).
- **Pagination**: 
  - To paginate, simply return `ResourceName::collection($model->paginate(10))`. 
  - Do NOT manually build pagination metadata. Laravel's Resource Collection automatically encapsulates the result into `data` and `meta` (which contains pagination links) objects, which Inertia consumes natively.
- **Formatting**: Use Resources to format data for the UI (e.g., formatting monetary integers into currency strings) and to prevent data leaks (explicitly pick safe fields).

## 6. Complex Queries & Calculations
- **Core Rule**: Do NOT place complex queries, cross-domain logic, or heavy mathematical calculations inside Controllers or Models.
- **Responsibility**: 
  - For standard complex queries (e.g., filtering, aggregations on a single domain), use **Eloquent Query Scopes** inside the Model.
  - For extremely complex operations (e.g., cross-domain calculations, financial ledger generation, projections), create a dedicated Read/Query **Action Class** (or Domain Service) in the `Actions` folder (e.g., `GenerateMonthlyCashflow`).
- **Constraints**: 
  - Models must not contain logic that touches other domains (e.g., `Invoice` model should not query `ClosingPeriod` directly).
  - Actions must remain strictly Single Responsibility. If an Action needs another calculation, use Dependency Injection to call another Action.
