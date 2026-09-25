<?php

declare(strict_types=1);

namespace App\Domains\Identity\Actions;

use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Models\User;
use Illuminate\Validation\ValidationException;

class DeleteUser
{
    /**
     * Delete a user with safeguard validations.
     *
     * @param User $user
     * @param User $actor Currently authenticated user performing the deletion
     * @throws ValidationException
     */
    public function execute(User $user, User $actor): void
    {
        if ($user->id === $actor->id) {
            throw ValidationException::withMessages([
                'user' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ]);
        }

        // If the user has pimpinan role, ensure there's at least one other pimpinan remaining
        if ($user->hasRole(UserRole::PIMPINAN->value)) {
            $otherPimpinanCount = User::role(UserRole::PIMPINAN->value)
                ->where('id', '!=', $user->id)
                ->count();

            if ($otherPimpinanCount === 0) {
                throw ValidationException::withMessages([
                    'user' => 'Tidak dapat menghapus Pimpinan terakhir di dalam sistem.',
                ]);
            }
        }

        $user->delete();
    }
}
