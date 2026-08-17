<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
        <link rel="shortcut icon" href="/images/favicon.ico">

        <!-- Inline theme initialization to prevent flash of initial state (FOIC) -->
        <script>
            (function() {
                try {
                    var mode = localStorage.getItem('app_fiscal_mode') || 'ppn';
                    document.documentElement.setAttribute('data-fiscal-mode', mode);
                } catch (e) {}
            })();
        </script>

        <!-- Stylesheets & Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
