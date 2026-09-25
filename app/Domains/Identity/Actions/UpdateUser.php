<?php

declare(strict_types=1);

namespace App\Domains\Identity\Actions;

use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UpdateUser
{
    /**
     * Update an existing user and sync their role.
     *
     * @param User $user
     * @param array{
     *     name: string,
     *     email: string,
     *     password?: ?string,
     *     role: string,
     *     status?: string
     * } $data
     */
    public function execute(User $user, array $data): User
    {
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (isset($data['status'])) {
            $updateData['status'] = UserStatus::from($data['status']);
        }

        $user->update($updateData);

        if (! empty($data['role'])) {
            $role = Role::findOrCreate($data['role'], 'web');
            $user->syncRoles([$role]);
        }

        return $user;
    }
}
