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
            'client_name' => $this->client?->name ?? 'Unknown Client',
            'sales_id' => $this->sales_id,
            'sales' => $this->whenLoaded('sales', fn () => $this->sales ? [
                'id' => $this->sales->id,
                'name' => $this->sales->name,
                'commission_rate' => (float) ($this->sales->commission_rate ?? 0),
            ] : null),
            'sales_commission_rate' => (float) ($this->sales?->commission_rate ?? 0),
            'sales_pic' => $this->sales?->name ?? '-',
            'fiscal_mode' => $this->fiscal_mode?->value,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'contract_value' => (float) $this->contract_value,
            'target_qty' => $this->target_qty,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'locations' => $this->whenLoaded('locations', fn () => ProjectLocationResource::collection($this->locations)->resolve(), []),
            'purchase_orders' => $this->whenLoaded('purchaseOrders', fn () => \App\Http\Resources\Procurement\PurchaseOrderResource::collection($this->purchaseOrders)->resolve(), []),
            'invoices' => $this->whenLoaded('invoices', fn () => $this->invoices->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'status' => $inv->status?->value,
                'subtotal' => (float) $inv->subtotal,
                'ppn' => (float) $inv->ppn,
                'total' => (float) $inv->total,
                'transaction_date' => $inv->transaction_date?->toDateString(),
                'due_date' => $inv->due_date?->toDateString(),
                'payment_plan' => $inv->paymentPlan ? [
                    'id' => $inv->paymentPlan->id,
                    'scheme' => $inv->paymentPlan->scheme?->value,
                    'total_amount' => (float) $inv->paymentPlan->total_amount,
                    'notes' => $inv->paymentPlan->notes,
                    'terms' => $inv->paymentPlan->terms->map(fn ($term) => [
                        'id' => $term->id,
                        'sort_order' => $term->sort_order,
                        'label' => $term->label,
                        'amount' => (float) $term->amount,
                        'percent' => (float) $term->percent,
                        'due_date' => $term->due_date?->toDateString(),
                        'status' => $term->status?->value,
                        'paid_amount' => (float) $term->settlements->sum('amount'),
                        'remaining_amount' => (float) max(0, $term->amount - $term->settlements->sum('amount')),
                        'settlements' => $term->settlements->map(fn ($s) => [
                            'id' => $s->id,
                            'amount' => (float) $s->amount,
                            'paid_at' => $s->paid_at?->toDateString(),
                            'payment_method' => $s->payment_method,
                            'payment_ref' => $s->payment_ref,
                            'notes' => $s->notes,
                        ]),
                        'notes' => $term->notes,
                        'settlements' => $term->settlements->map(fn ($set) => [
                            'id' => $set->id,
                            'amount' => (float) $set->amount,
                            'paid_at' => $set->paid_at?->toDateString(),
                            'payment_method' => $set->payment_method,
                            'payment_ref' => $set->payment_ref,
                            'notes' => $set->notes,
                        ]),
                    ]),
                ] : null,
            ])),
            'invoice_issued' => $this->whenLoaded('invoices', fn () => $this->invoices->contains(fn ($inv) => $inv->status?->value !== 'draft'), false),
            'invoice_number' => $this->whenLoaded('invoices', fn () => $this->invoices->firstWhere('invoice_number', '!=', null)?->invoice_number, null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
