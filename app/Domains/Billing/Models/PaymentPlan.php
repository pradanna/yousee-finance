<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\PaymentScheme;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PaymentPlan extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\PaymentPlanFactory::new();
    }

    protected $fillable = [
        'payable_type',
        'payable_id',
        'scheme',
        'total_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheme' => PaymentScheme::class,
            'total_amount' => 'decimal:2',
        ];
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function terms(): HasMany
    {
        return $this->hasMany(PaymentTerm::class)->orderBy('sort_order');
    }
}
