<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSettlement extends Model
{
    use HasUuids;

    protected $fillable = [
        'payment_term_id',
        'amount',
        'paid_at',
        'payment_method',
        'payment_ref',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }
}
