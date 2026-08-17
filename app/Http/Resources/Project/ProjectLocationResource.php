<?php

declare(strict_types=1);

namespace App\Http\Resources\Project;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectLocationResource extends JsonResource
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
            'project_id' => $this->project_id,
            'vendor_id' => $this->vendor_id,
            'vendor' => $this->whenLoaded('vendor', fn () => [
                'id' => $this->vendor->id,
                'name' => $this->vendor->name,
            ]),
            'code' => $this->code,
            'area' => $this->area,
            'description' => $this->description,
            'type' => $this->type?->value,
            'size' => $this->size,
            'orientation' => $this->orientation?->value,
            'lighting' => $this->lighting?->value,
            'qty' => $this->qty,
            'vendor_cost' => (float) $this->vendor_cost,
            'top_notes' => $this->top_notes,
            // Derived, never stored — see docs/databases/tables/project_locations.dbml
            'po_issued' => ! is_null($this->purchase_order_id),
            'po_number' => $this->whenLoaded('purchaseOrder', fn () => $this->purchaseOrder?->po_number),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
