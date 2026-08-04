---
name: pest-testing-generator
description: Generate robust automated tests for the backend (Feature and Unit tests) using Pest or PHPUnit. Trigger when asked to write tests, create unit tests, or test a specific feature.
---

# Financial Testing Standards (Pest/PHPUnit)

Testing is critical for a financial application. When asked to write tests, you MUST adhere to the following standards:

## Step 1: Determine Test Type
- **Unit Tests**: Use for testing Domain Actions independently. Mock external dependencies if necessary.
- **Feature Tests**: Use for testing the full HTTP lifecycle (Controller -> Request Validation -> Action -> Resource Response).

## Step 2: Setup Database State
- You MUST use the `RefreshDatabase` or `DatabaseTransactions` trait so the database state is isolated between tests.
- Always use Model Factories to generate dummy data. Never hardcode database inserts.

## Step 3: Test Scenarios (The "Happy" and "Sad" Paths)
For any financial feature, you must generate at least these scenarios:
1. **The Happy Path**: The transaction succeeds, balances are updated correctly, and the correct HTTP status is returned.
2. **The Validation Path**: The Form Request rejects invalid input (e.g., passing a string for an amount, or missing required fields).
3. **The Edge Cases (Sad Paths)**: 
   - Insufficient balance (if applicable).
   - Negative amounts.
   - Unauthorized access (testing Laravel Policies).

## Step 4: Strict Assertions
- Do not just assert `assertStatus(200)`.
- You MUST assert the database state has changed correctly (e.g., `assertDatabaseHas('wallets', ['balance' => $expected])`).
- You MUST assert the JSON response matches the expected API Resource structure.
