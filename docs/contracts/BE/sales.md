# Sales Master Data Contract

**Domain**: Sales
**Endpoint Prefix**: `/sales`

## 1. Page: Sales Index
**URL**: `GET /sales`
**Component**: `Sales/Index`

### Inertia Props Provided
```json
{
  "sales": {
    "data": [
      {
        "id": 1,
        "name": "Budi Santoso",
        "email": "budi@yousee.com",
        "created_at": "2026-08-05T12:00:00+00:00",
        "updated_at": "2026-08-05T12:00:00+00:00"
      }
    ],
    "links": {
      "first": "...",
      "last": "...",
      "prev": null,
      "next": "..."
    },
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 1,
      "links": [],
      "path": "...",
      "per_page": 10,
      "to": 10,
      "total": 1
    }
  },
  "flash": {
    "success": "Optional success message",
    "error": "Optional error message"
  },
  "errors": {} // Validation errors if any (422)
}
```

## 2. API Endpoints (Form Submissions)

### A. Create Sales
**URL**: `POST /sales`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "email": "string (required, email, max:255, unique)"
}
```
**Response**: Redirect back to `/sales` with `success` flash session.

### B. Update Sales
**URL**: `PUT /sales/{sale}`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "email": "string (required, email, max:255, unique)"
}
```
**Response**: Redirect back to `/sales` with `success` flash session.

### C. Delete Sales (Hard Delete)
**URL**: `DELETE /sales/{sale}`
**Payload**: Empty
**Response**: Redirect back with `success`.
