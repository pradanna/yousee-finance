<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Models;

use App\Domains\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected static function newFactory()
    {
        return \Database\Factories\VendorFactory::new();
    }

    protected $fillable = [
        'name',
        'npwp',
        'phone',
        'email',
        'address',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active vendors.
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_archived', false);
    }

    /**
     * Get the purchase orders associated with the vendor.
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
