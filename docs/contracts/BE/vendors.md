# Vendor Master Data Contract

**Domain**: Master
**Endpoint Prefix**: `/vendors`

## 1. Page: Vendors Index
**URL**: `GET /vendors`
**Component**: `Vendor/Index`

### Inertia Props Provided
```json
{
  "vendors": {
    "data": [
      {
        "id": 1,
        "name": "PT Jaya Abadi",
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
  "errors": {} // Validation errors if any
}
```

## 2. API Endpoints (Form Submissions)

### A. Create Vendor
**URL**: `POST /vendors`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "npwp": "string (optional, max:255)"
}
```
**Response**: Redirect back to `/vendors` with `success` flash session.

### B. Update Vendor
**URL**: `PUT /vendors/{vendor}`
**Payload**:
```json
{
  "name": "string (required, max:255)",
  "npwp": "string (optional, max:255)"
}
```
**Response**: Redirect back to `/master/vendors` with `success` flash session.

### C. Archive Vendor
**URL**: `POST /master/vendors/{vendor}/archive`
**Payload**: Empty
**Response**: Redirect back with `success`.

### D. Unarchive Vendor
**URL**: `POST /master/vendors/{vendor}/unarchive`
**Payload**: Empty
**Response**: Redirect back with `success`.

### E. Delete Vendor (Soft Delete)
**URL**: `DELETE /master/vendors/{vendor}`
**Payload**: Empty
**Response**: Redirect back with `success`.
