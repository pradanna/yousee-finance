# Client Master Data Contract

**Domain**: Client
**Endpoint Prefix**: `/clients`

## 1. Page: Clients Index
**URL**: `GET /clients`
**Component**: `Client/Index`

### Inertia Props Provided
```json
{
  "clients": {
    "data": [
      {
        "id": 1,
        "name": "PT Sejahtera Raya",
        "email": "contact@sejahtera.com",
        "phone": "081234567890",
        "address": "Jl. Sudirman No. 1, Jakarta",
        "npwp": "12.345.678.9-012.000",
        "is_archived": false,
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

### A. Create Client
**URL**: `POST /clients`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "email": "string (optional, email, max:255)",
  "phone": "string (optional, max:50)",
  "address": "string (optional)",
  "npwp": "string (optional, max:50)"
}
```
**Response**: Redirect back to `/clients` with `success` flash session.

### B. Update Client
**URL**: `PUT /clients/{client}`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "email": "string (optional, email, max:255)",
  "phone": "string (optional, max:50)",
  "address": "string (optional)",
  "npwp": "string (optional, max:50)"
}
```
**Response**: Redirect back to `/clients` with `success` flash session.

### C. Archive Client
**URL**: `POST /clients/{client}/archive`
**Payload**: Empty
**Response**: Redirect back with `success`.

### D. Unarchive Client
**URL**: `POST /clients/{client}/unarchive`
**Payload**: Empty
**Response**: Redirect back with `success`.

### E. Delete Client (Soft Delete)
**URL**: `DELETE /clients/{client}`
**Payload**: Empty
**Response**: Redirect back with `success`.
