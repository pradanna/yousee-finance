<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use App\Domains\Identity\Enums\UserRole;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'active' => 'boolean',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::updating(function (User $user) {
            // Admin tidak bisa self-elevate jadi Pimpinan
            if ($user->isDirty('role') && $user->getOriginal('role') === UserRole::ADMIN && $user->role === UserRole::PIMPINAN) {
                if (auth()->check()) {
                    $currentUser = auth()->user();
                    $currentUserRole = $currentUser->getOriginal('role') ?? $currentUser->role;
                    if ($currentUserRole !== UserRole::PIMPINAN) {
                        throw new \DomainException("Admin tidak bisa self-elevate menjadi Pimpinan.");
                    }
                }
            }
        });
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isPimpinan(): bool
    {
        return $this->role === UserRole::PIMPINAN;
    }

    public function isActive(): bool
    {
        return (bool) $this->active;
    }
}
