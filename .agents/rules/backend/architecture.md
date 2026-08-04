# Backend Architecture Rules (Lite DDD / Action-Based)

This project uses a "Lite DDD" (Action-Based) architecture to maintain a clean, scalable, and maintainable codebase, which is especially important for a financial system.

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

## 4. Validation, DTOs, & Enums
- **Core Rule**: Never trust client-side input.
- **Responsibility**: 
  - Use `Form Requests` (`app/Http/Requests`) to validate input *before* it reaches the Controller/Action.
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
