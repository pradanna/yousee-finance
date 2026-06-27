<?php

namespace App\Domains\Master\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'status', // active / finished
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Hitung laba-rugi proyek per Mode Fiskal.
     * Revenue = Total Invoice (Issued/Paid)
     * Cost = Total PO
     * Laba/Rugi = Revenue - Cost
     */
    public function calculateProfitLoss(FiscalMode|string $mode): float
    {
        $modeValue = $mode instanceof FiscalMode ? $mode->value : $mode;

        $revenue = (float) $this->invoices()
            ->where('fiscal_mode', $modeValue)
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $cost = (float) $this->purchaseOrders()
            ->where('fiscal_mode', $modeValue)
            ->sum('total');

        return $revenue - $cost;
    }
}
