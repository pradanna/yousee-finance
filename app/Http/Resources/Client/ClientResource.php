<?php

declare(strict_types=1);

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hasNpwp = ! empty($this->npwp) && trim((string) $this->npwp) !== '';

        return [
            'id' => (string) $this->id,
            'name' => (string) $this->name,
            'npwp' => $this->npwp ? (string) $this->npwp : null,
            'phone' => $this->phone ? (string) $this->phone : null,
            'email' => $this->email ? (string) $this->email : null,
            'address' => $this->address ? (string) $this->address : null,
            'is_archived' => (bool) $this->is_archived,
            'pkp' => $hasNpwp,
            'status' => $this->is_archived ? 'archived' : 'active',
            'count' => (int) ($this->projects_count ?? 0),
            'total' => (float) ($this->projects_sum_contract_value ?? 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
