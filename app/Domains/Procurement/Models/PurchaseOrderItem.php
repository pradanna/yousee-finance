<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Models;

use App\Domains\Project\Models\ProjectLocation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\PurchaseOrderItemFactory::new();
    }

    protected $fillable = [
        'purchase_order_id',
        'project_location_id',
        'name',
        'quantity',
        'price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::saved(fn (PurchaseOrderItem $item) => $item->purchaseOrder->recalculateTotal());
        static::deleted(fn (PurchaseOrderItem $item) => $item->purchaseOrder->recalculateTotal());
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function projectLocation(): BelongsTo
    {
        return $this->belongsTo(ProjectLocation::class);
    }
}
