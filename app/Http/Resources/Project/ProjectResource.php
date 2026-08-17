<?php

declare(strict_types=1);

namespace App\Http\Resources\Project;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'client_id' => $this->client_id,
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ]),
            'sales_id' => $this->sales_id,
            'sales' => $this->whenLoaded('sales', fn () => $this->sales ? [
                'id' => $this->sales->id,
                'name' => $this->sales->name,
            ] : null),
            'fiscal_mode' => $this->fiscal_mode?->value,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'contract_value' => (float) $this->contract_value,
            'target_qty' => $this->target_qty,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
