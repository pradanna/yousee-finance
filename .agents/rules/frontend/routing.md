# Frontend Routing Rules (Inertia + Ziggy)

Inertia.js relies on Laravel for defining routes (in `routes/web.php`), but requires specific tools on the frontend to navigate between them without triggering full page reloads.

## 1. Internal Navigation (The `<Link>` Component)
- **Core Rule**: You MUST use Inertia's `<Link>` component for all internal application navigation.
- **Why**: Using standard HTML `<a>` tags will cause a full browser refresh, destroying the Single Page Application (SPA) state and significantly degrading performance.
- **Usage**:
  ```tsx
  import { Link } from '@inertiajs/react';
  
  // ✅ DO THIS
  <Link href={route('transactions.index')} className="btn-primary">View Transactions</Link>
  
  // ❌ NEVER DO THIS (unless linking to an external website like google.com)
  <a href="/transactions" className="btn-primary">View Transactions</a>
  ```

## 2. URL Generation (Ziggy)
- **Core Rule**: NEVER hardcode internal URL paths (e.g., `/transactions/123/edit`) in the frontend.
- **Why**: Hardcoded URLs break easily if the backend route URI changes.
- **Usage**: You MUST use the `route()` helper function provided by the Ziggy library, referencing the Laravel named route.
  ```tsx
  // ✅ DO THIS
  href={route('transactions.edit', { id: transaction.id })}
  
  // ❌ NEVER DO THIS
  href={`/transactions/${transaction.id}/edit`}
  ```

## 3. Form Submissions
- For submitting forms, DO NOT use `<Link method="post">`.
- Use `react-hook-form` along with Inertia's `router.post()`, `router.put()`, or `router.delete()` as defined in the `state-management.md` rules.

## 4. Active Navigation States
- When building navigation bars or sidebars, use Ziggy's `route().current()` to determine if a link is active and apply the appropriate Tailwind CSS classes.
  ```tsx
  const isActive = route().current('transactions.*');
  <Link 
      href={route('transactions.index')} 
      className={isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'}
  >
      Transactions
  </Link>
  ```
