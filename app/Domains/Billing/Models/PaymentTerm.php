<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\PaymentTermStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentTerm extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\PaymentTermFactory::new();
    }

    protected $fillable = [
        'payment_plan_id',
        'sort_order',
        'label',
        'amount',
        'percent',
        'due_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentTermStatus::class,
            'sort_order' => 'integer',
            'amount' => 'decimal:2',
            'percent' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function paymentPlan(): BelongsTo
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(PaymentSettlement::class)->orderBy('paid_at');
    }

    /**
     * Total nominal yang sudah direalisasi dari semua settlement di termin ini.
     */
    public function paidAmount(): float
    {
        return (float) $this->settlements()->sum('amount');
    }

    /**
     * paid_amount & is_overdue sengaja gak jadi kolom — nunggu
     * payment_settlements ada (lihat dbml Note). Placeholder di bawah biar
     * kontraknya jelas sebelum settlement dibangun.
     */
    public function isOverdue(): bool
    {
        return $this->status !== PaymentTermStatus::PAID && $this->due_date->isPast();
    }
}
