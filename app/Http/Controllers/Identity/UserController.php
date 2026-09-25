<?php

declare(strict_types=1);

namespace App\Http\Controllers\Identity;

use App\Domains\Identity\Actions\CreateUser;
use App\Domains\Identity\Actions\DeleteUser;
use App\Domains\Identity\Actions\ToggleUserStatus;
use App\Domains\Identity\Actions\UpdateUser;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Identity\StoreUserRequest;
use App\Http\Requests\Identity\UpdateUserRequest;
use App\Http\Resources\Identity\UserResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $actor = $request->user();
        if (! $actor || (! $actor->hasRole(UserRole::PIMPINAN->value) && ! $actor->hasRole(UserRole::ADMIN->value))) {
            abort(403, 'Hanya Pimpinan yang memiliki akses ke Manajemen User.');
        }

        $search = trim((string) $request->query('search', ''));
        $roleFilter = trim((string) $request->query('role', 'all'));
        $statusFilter = trim((string) $request->query('status', 'all'));

        $query = User::with('roles')->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($roleFilter !== '' && $roleFilter !== 'all') {
            $query->role($roleFilter);
        }

        if ($statusFilter !== '' && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        $users = $query->paginate(15)->withQueryString();

        $metrics = [
            'totalUsers' => User::count(),
            'pimpinanCount' => User::role(UserRole::PIMPINAN->value)->count(),
            'akuntanCount' => User::role(UserRole::AKUNTAN->value)->count(),
            'staffCount' => User::role(UserRole::STAFF->value)->count(),
            'adminCount' => User::role(UserRole::ADMIN->value)->count(),
            'activeUsers' => User::where('status', UserStatus::ACTIVE)->count(),
            'inactiveUsers' => User::where('status', '!=', UserStatus::ACTIVE)->count(),
        ];

        return Inertia::render('Users', [
            'users' => UserResource::collection($users),
            'metrics' => $metrics,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request, CreateUser $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'User baru berhasil ditambahkan.');
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user, UpdateUser $action): RedirectResponse
    {
        $action->execute($user, $request->validated());

        return redirect()->back()->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user, DeleteUser $action): RedirectResponse
    {
        $actor = $request->user();
        if (! $actor || (! $actor->hasRole(UserRole::PIMPINAN->value) && ! $actor->hasRole(UserRole::ADMIN->value))) {
            abort(403, 'Hanya Pimpinan yang memiliki akses untuk menghapus user.');
        }

        $action->execute($user, $actor);

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    /**
     * Toggle or update user active status.
     */
    public function toggleStatus(Request $request, User $user, ToggleUserStatus $action): RedirectResponse
    {
        $actor = $request->user();
        if (! $actor || (! $actor->hasRole(UserRole::PIMPINAN->value) && ! $actor->hasRole(UserRole::ADMIN->value))) {
            abort(403, 'Hanya Pimpinan yang memiliki akses untuk mengubah status user.');
        }

        $targetStatus = $request->input('status');
        $action->execute($user, $actor, is_string($targetStatus) ? $targetStatus : null);

        return redirect()->back()->with('success', 'Status user berhasil diperbarui.');
    }
}
