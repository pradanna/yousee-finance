<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxSettlement extends Model
{
    use HasUuids;

    protected $table = 'tax_settlements';

    protected $fillable = [
        'month',
        'year',
        'fiscal_mode',
        'ntpn',
        'paid_date',
        'bank_name',
        'ppn_keluaran_total',
        'ppn_masukan_total',
        'net_amount',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'fiscal_mode' => FiscalMode::class,
            'paid_date' => 'date',
            'ppn_keluaran_total' => 'float',
            'ppn_masukan_total' => 'float',
            'net_amount' => 'float',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
