<?php

declare(strict_types=1);

namespace App\Domains\Identity\Actions;

use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Illuminate\Validation\ValidationException;

class ToggleUserStatus
{
    /**
     * Toggle or update user active status.
     *
     * @param User $user
     * @param User $actor
     * @param ?string $targetStatus
     * @throws ValidationException
     */
    public function execute(User $user, User $actor, ?string $targetStatus = null): User
    {
        if ($user->id === $actor->id) {
            throw ValidationException::withMessages([
                'status' => 'Anda tidak dapat mengubah status akun Anda sendiri.',
            ]);
        }

        $newStatus = $targetStatus
            ? UserStatus::from($targetStatus)
            : ($user->status === UserStatus::ACTIVE ? UserStatus::INACTIVE : UserStatus::ACTIVE);

        // Safeguard: do not deactivate the last active pimpinan
        if ($newStatus !== UserStatus::ACTIVE && $user->hasRole(UserRole::PIMPINAN->value)) {
            $otherActivePimpinanCount = User::role(UserRole::PIMPINAN->value)
                ->where('id', '!=', $user->id)
                ->where('status', UserStatus::ACTIVE)
                ->count();

            if ($otherActivePimpinanCount === 0) {
                throw ValidationException::withMessages([
                    'status' => 'Tidak dapat menonaktifkan Pimpinan terakhir yang aktif.',
                ]);
            }
        }

        $user->update(['status' => $newStatus]);

        return $user;
    }
}
