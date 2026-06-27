<?php

namespace App\Domains\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
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

        static::saved(function (InvoiceItem $item) {
            // Recalculate invoice totals when an item is saved/updated
            $invoice = $item->invoice;
            $invoice->calculateTotalsAndTax();
            $invoice->saveQuietly();
        });
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
