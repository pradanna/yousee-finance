<?php

namespace App\Domains\Procurement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'name',
        'quantity',
        'price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'float',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saved(function (PurchaseOrderItem $item) {
            // Ketika item disimpan, hitung ulang total PO
            $item->purchaseOrder->recalculateTotal();
        });
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
