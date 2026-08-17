<?php

declare(strict_types=1);

namespace App\Domains\Project\Models;

use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLocation extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\ProjectLocationFactory::new();
    }

    protected $fillable = [
        'project_id',
        'vendor_id',
        'purchase_order_id',
        'code',
        'area',
        'description',
        'type',
        'size',
        'orientation',
        'lighting',
        'qty',
        'vendor_cost',
        'top_notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => LocationType::class,
            'orientation' => LocationOrientation::class,
            'lighting' => LocationLighting::class,
            'qty' => 'integer',
            'vendor_cost' => 'decimal:2',
        ];
    }

    /**
     * Field deskriptif yang terkunci begitu titik lokasi sudah punya PO.
     * lighting & top_notes sengaja dikecualikan — dua field itu masih boleh
     * disunting lewat alur "Edit Parameter PO" setelah PO terbit.
     *
     * @var list<string>
     */
    private const LOCKED_FIELDS = [
        'vendor_id',
        'area',
        'description',
        'type',
        'size',
        'orientation',
        'qty',
        'vendor_cost',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (ProjectLocation $location) {
            if ($location->exists
                && ! is_null($location->getOriginal('purchase_order_id'))
                && $location->isDirty(self::LOCKED_FIELDS)
            ) {
                throw new \DomainException('Titik lokasi yang sudah diterbitkan PO tidak dapat diubah.');
            }
        });

        static::deleting(function (ProjectLocation $location) {
            if (! is_null($location->purchase_order_id)) {
                throw new \DomainException('Titik lokasi yang sudah diterbitkan PO tidak dapat dihapus.');
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
