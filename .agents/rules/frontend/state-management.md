# Frontend State & Form Management Rules

## 1. Form Handling (React Hook Form + Zod)
- **Core Rule**: ALWAYS use `react-hook-form` combined with `zod` for all form state management and client-side validation. Do NOT use Inertia's built-in `useForm` for form state.
- **Why**: Finance applications require immediate, real-time client-side validation for better User Experience. Zod also provides strict type inference that guarantees payload integrity before hitting the server.
- **Submission**: Use `react-hook-form`'s `handleSubmit` to validate data. Once valid, use Inertia's `router.post()` (or `router.put()`) to send the data to the backend.
- **Error Mapping**: You MUST catch backend validation errors (HTTP 422) in the Inertia `onError` callback and map them back to the form using `react-hook-form`'s `setError` function.
  ```tsx
  const { register, handleSubmit, setError } = useForm({
      resolver: zodResolver(transactionSchema)
  });

  const onSubmit = (data) => {
      router.post('/transaction', data, {
          onError: (serverErrors) => {
              Object.keys(serverErrors).forEach(key => setError(key, { message: serverErrors[key] }));
          }
      });
  };
  ```

## 2. Global State & Shared Data
- **Core Rule**: Avoid heavy client-side state managers (like Redux or Zustand) unless absolutely necessary.
- **Inertia Shared Props**: Rely on Inertia's ability to share data globally (via `HandleInertiaRequests` middleware on the backend). Access global data like the authenticated user or flash messages using the `usePage<PageProps>()` hook.

## 3. Local State
- Use React's `useState` and `useReducer` for component-level UI state (e.g., toggling a modal, active tab).
- Do not duplicate data provided by Inertia `props` into local state unless you intend to mutate it independently before submission.
