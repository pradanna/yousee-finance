<?php

declare(strict_types=1);

namespace App\Http\Resources\Procurement;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
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
            'po_number' => $this->po_number,
            'vendor_id' => $this->vendor_id,
            'vendor' => $this->whenLoaded('vendor', fn () => [
                'id' => $this->vendor->id,
                'name' => $this->vendor->name,
            ]),
            'project_id' => $this->project_id,
            'fiscal_mode' => $this->fiscal_mode?->value,
            'transaction_date' => $this->transaction_date?->toDateString(),
            'issued_at' => $this->issued_at?->toDateString(),
            'subtotal' => (float) $this->subtotal,
            'ppn' => (float) $this->ppn,
            'total' => (float) $this->total,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'project_location_id' => $item->project_location_id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'price' => (float) $item->price,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
