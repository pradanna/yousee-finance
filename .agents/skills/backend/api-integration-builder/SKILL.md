---
name: api-integration-builder
description: Build robust third-party API integrations (e.g., Payment Gateways, Banks, Webhooks). Trigger when asked to connect to an external API, build a webhook, or integrate a third-party service.
---

# Third-Party API Integration Builder

When integrating external services (like Payment Gateways or Bank APIs) into this financial app, stability and auditability are paramount. Follow these rules:

## Step 1: Create the Service Class
- External API calls MUST NOT be placed in Controllers or Domain Actions directly. 
- Create a dedicated Service class in `app/Infrastructure/Services/` or `app/Services/` (e.g., `MidtransPaymentService.php`).

## Step 2: Use Laravel HTTP Client
- You MUST use Laravel's `Http` facade (`Illuminate\Support\Facades\Http`) for all outgoing requests.
- Always include strict timeouts (e.g., `->timeout(10)`).

## Step 3: Implement DTOs
- Create Data Transfer Objects (DTOs) for the Request Payload and the Response. Do not pass raw arrays to the service.
- Ensure all monetary values are explicitly cast and documented (e.g., knowing if the API expects cents or base currency).

## Step 4: Error Handling & Audit Logging
Financial transactions must never fail silently.
- Wrap the API call in a `try-catch` block.
- You MUST log every request attempt and every failure using `Log::info()` or `Log::error()`. Include contextual data (like `transaction_id`, `user_id`) in the log array.
- If the API returns an error, map it to a custom Exception so the Domain Action can handle it gracefully.
