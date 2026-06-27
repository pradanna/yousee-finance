<?php

namespace App\Domains\Master\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sales extends Model
{
    protected $fillable = [
        'name',
        'email',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Hitung total performa sales berdasarkan total nominal invoice per mode fiskal tertentu.
     * Tidak diagregasikan lintas mode.
     */
    public function calculatePerformance(FiscalMode|string $mode): float
    {
        $modeValue = $mode instanceof FiscalMode ? $mode->value : $mode;

        return (float) $this->invoices()
            ->where('fiscal_mode', $modeValue)
            ->whereIn('status', ['issued', 'paid']) // Hanya menghitung invoice yang sudah diterbitkan/lunas
            ->sum('total');
    }
}
