---
name: zod-form-builder
description: Generate a React form using React Hook Form, Zod, and Inertia.js. Trigger when asked to create a form, handle form submission, or add validation to an existing form.
---

# React Hook Form & Zod Builder

When creating forms in this application, you MUST NOT use Inertia's built-in `useForm` for state management. You must use React Hook Form combined with Zod for strict client-side validation.

## Step 1: Define the Zod Schema
Create a strict Zod schema for the form payload.
- Define custom error messages (e.g., `z.number().min(1, "Amount must be at least 1")`).
- Infer the TypeScript type from the schema: `type FormData = z.infer<typeof schema>;`

## Step 2: Setup React Hook Form
Initialize `useForm` with the `zodResolver`.
```tsx
const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
});
```

## Step 3: Handle Submission via Inertia
Create the `onSubmit` handler. Use `router.post()` or `router.put()` to send the data.
- You MUST catch HTTP 422 validation errors in the `onError` callback and map them to `setError`.
```tsx
const onSubmit = (data: FormData) => {
    router.post('/endpoint', data, {
        onError: (serverErrors) => {
            Object.keys(serverErrors).forEach((key) => {
                setError(key as any, { message: serverErrors[key] });
            });
        }
    });
};
```

## Step 4: Build the UI
Render the form using Tailwind CSS. Ensure validation error messages are displayed clearly in red below each input field.
