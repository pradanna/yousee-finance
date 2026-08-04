---
name: mysql-finance-optimizer
description: Optimize Eloquent queries and MySQL database performance for financial reporting or heavy data aggregation. Trigger when asked to optimize a query, profile the database, fix slow queries, or add indexes.
---

# MySQL Finance Optimizer

When asked to optimize a query or database performance in this financial application, you MUST follow these steps to ensure data integrity and query efficiency.

## Step 1: Analyze the Query
- Convert the provided Eloquent query into raw SQL conceptually.
- Look for common bottlenecks:
  - N+1 query problems.
  - Missing indexes on `WHERE` or `ORDER BY` clauses.
  - Large data sets loaded into memory instead of using aggregation (`SUM`, `COUNT`) at the database level.
  - Lack of chunking (`chunk()`, `cursor()`).

## Step 2: Recommend Indexes
Financial apps often query by `wallet_id`, `transaction_date`, or `status`. 
- Propose the correct MySQL indexes (especially Composite Indexes if multiple columns are frequently queried together).
- Generate the exact Laravel Migration code required to add these indexes safely.

## Step 3: Refactor Eloquent Code
Rewrite the provided code to be more efficient:
- Use `selectRaw()` or database-level aggregation for calculations.
- Enforce the use of `chunk()` or `lazy()` if processing massive records.
- Move repetitive query logic into Model Local Scopes.

## Step 4: Verification
Explain briefly why the new query is faster and how the proposed index helps the MySQL optimizer (e.g., explaining how it reduces table scans).
