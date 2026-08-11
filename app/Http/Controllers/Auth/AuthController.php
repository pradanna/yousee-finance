<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Domains\Identity\Actions\LoginUser;
use App\Domains\Identity\Actions\LogoutUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request, LoginUser $action): JsonResponse
    {
        $user = $action->execute($request);

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'roles' => $user->getRoleNames(),
            ]
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request, LogoutUser $action): JsonResponse
    {
        $action->execute($request);

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }
}
