<?php

namespace App\Domains\Identity\Actions;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class LoginUser
{
    /**
     * Handle the login logic.
     *
     * @param LoginRequest $request
     * @return \App\Domains\Identity\Models\User
     * @throws ValidationException
     */
    public function execute(LoginRequest $request)
    {
        // 1. Check Rate Limiter
        $request->ensureIsNotRateLimited();

        // 2. Attempt Authentication
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            \Illuminate\Support\Facades\RateLimiter::hit($request->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($request->throttleKey());

        // 3. Get Authenticated User
        $user = Auth::user();

        // 4. Check if User is Active
        if (!$user->isActive()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Akun Anda telah dinonaktifkan.',
            ]);
        }

        // 5. Update Audit Trail
        $user->update([
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $request->ip(),
        ]);

        // 6. Prevent Session Fixation
        $request->session()->regenerate();

        return $user;
    }
}
