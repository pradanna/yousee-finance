<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PPhAdjustment extends Model
{
    protected $fillable = [
        'source_type',
        'source_id',
        'amount',
        'rate', // e.g. 0.02 for PPh 23 (2%)
        'description',
    ];

    protected $casts = [
        'amount' => 'float',
        'rate' => 'float',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (PPhAdjustment $adj) {
            if ($adj->source_type === Invoice::class) {
                // Untuk Billing (Invoice), hanya diperbolehkan di Mode PPN
                $invoice = $adj->source;
                if ($invoice && $invoice->fiscal_mode !== FiscalMode::PPN->value && $invoice->fiscal_mode !== FiscalMode::PPN) {
                    throw new \DomainException("PPh Adjustment untuk Billing hanya diperbolehkan pada Mode PPN.");
                }
            }
            // Untuk Procurement (PO), diperbolehkan di kedua mode (PPN & Non-PPN)
        });
    }

    /**
     * Polymorphic relation ke PurchaseOrder atau Invoice.
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
