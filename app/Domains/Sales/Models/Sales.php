<?php

namespace App\Domains\Sales\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sales extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'email',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\SalesFactory::new();
    }

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
