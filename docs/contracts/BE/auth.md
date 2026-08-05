# Auth Integration Contract (Provider: Backend)

Dokumen ini mendeskripsikan kontrak fitur Autentikasi (berbasis Session/Inertia) yang disediakan oleh tim **Backend**. 
Tim **Frontend** (FE) dapat menggunakan dokumen ini sebagai panduan utama untuk melakukan integrasi di *page component* (React/Vue).

---

## 1. Login

- **Endpoint:** `POST /login`
- **Tujuan:** Melakukan autentikasi user menggunakan email dan password.
- **Tipe:** Session-based (Inertia Compatible).

### Request Payload

| Field      | Type     | Required | Description |
|------------|----------|----------|-------------|
| `email`    | string   | Yes      | Alamat email user yang terdaftar |
| `password` | string   | Yes      | Kata sandi user |
| `remember` | boolean  | No       | Opsi "Ingat Saya" (opsional) |

### Responses

#### 🟢 Sukses (200 OK)
Sementara (tanpa UI), respon berupa JSON berikut. Namun saat integrasi penuh dengan FE, endpoint ini biasanya akan me-redirect (Inertia Visit) langsung ke `/dashboard`.
```json
{
    "message": "Login successful",
    "user": {
        "id": "uuid-string",
        "name": "John Doe",
        "email": "john@yousee.test",
        "status": "active",
        "roles": ["pimpinan"]
    }
}
```

#### 🔴 Gagal (422 Unprocessable Entity - Validation Errors)
Jika login gagal (password salah, email tak terdaftar, atau user INACTIVE), aplikasi tidak me-return JSON error standar API, melainkan **Inertia akan menangkap Validation Errors** di dalam props `page.props.errors`.

Contoh kembalian di *props* jika Kredensial Salah:
```json
{
    "email": "These credentials do not match our records."
}
```

Contoh kembalian di *props* jika Akun Inactive/Suspended:
```json
{
    "email": "Akun Anda telah dinonaktifkan."
}
```
> **FE Action:** Cukup render pesan error di bawah input `email` yang bersumber dari `errors.email`.

---

## 2. Logout

- **Endpoint:** `POST /logout`
- **Tujuan:** Menghapus sesi user yang sedang aktif dan regenerasi token keamanan (CSRF).
- **Tipe:** Session-based (Inertia Compatible).

### Request Payload
*Tidak ada payload khusus.* 

> **FE Action:** Pastikan pemanggilan dilakukan menggunakan metode POST bawaan Inertia: `router.post('/test-logout')`. Inertia akan otomatis menyertakan CSRF Token yang valid.

### Responses

#### 🟢 Sukses (200 OK)
Sementara membalas JSON. Saat integrasi penuh, backend akan memaksa redirect ke `/login`.
```json
{
    "message": "Logout successful"
}
```
