<?php

declare(strict_types=1);

namespace App\Http\Resources\Identity;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $roleNames = $this->roles->pluck('name')->toArray();
        $primaryRole = $roleNames[0] ?? 'staff';

        return [
            'id' => (string) $this->id,
            'name' => (string) $this->name,
            'email' => (string) $this->email,
            'role' => (string) $primaryRole,
            'roles' => $roleNames,
            'status' => (string) ($this->status->value ?? $this->status ?? 'active'),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
