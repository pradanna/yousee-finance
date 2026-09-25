<?php

declare(strict_types=1);

namespace App\Domains\Identity\Actions;

use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateUser
{
    /**
     * Create a new user and assign their role.
     *
     * @param array{
     *     name: string,
     *     email: string,
     *     password: string,
     *     role: string,
     *     status?: string
     * } $data
     */
    public function execute(array $data): User
    {
        $status = isset($data['status'])
            ? UserStatus::from($data['status'])
            : UserStatus::ACTIVE;

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'status' => $status,
            'email_verified_at' => now(),
        ]);

        $role = Role::findOrCreate($data['role'], 'web');
        $user->assignRole($role);

        return $user;
    }
}
