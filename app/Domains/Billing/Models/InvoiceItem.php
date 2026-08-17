<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Project\Models\ProjectLocation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\InvoiceItemFactory::new();
    }

    protected $fillable = [
        'invoice_id',
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

        static::saved(fn (InvoiceItem $item) => $item->invoice->recalculateTotals());
        static::deleted(fn (InvoiceItem $item) => $item->invoice->recalculateTotals());
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function projectLocation(): BelongsTo
    {
        return $this->belongsTo(ProjectLocation::class);
    }
}
