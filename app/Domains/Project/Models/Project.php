<?php

declare(strict_types=1);

namespace App\Domains\Project\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Client\Models\Client;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected static function newFactory()
    {
        return \Database\Factories\ProjectFactory::new();
    }

    protected $fillable = [
        'code',
        'name',
        'client_id',
        'sales_id',
        'fiscal_mode',
        'start_date',
        'end_date',
        'contract_value',
        'target_qty',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_mode' => FiscalMode::class,
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'contract_value' => 'decimal:2',
            'target_qty' => 'integer',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (Project $project) {
            if ($project->exists && $project->isDirty('fiscal_mode')) {
                throw new \DomainException('Fiscal Mode tidak dapat diubah setelah Project dibuat.');
            }
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(Sales::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(ProjectLocation::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Hitung laba-rugi proyek per Mode Fiskal.
     * Revenue = Total Invoice (Issued/Paid)
     * Cost = Total PO
     * Laba/Rugi = Revenue - Cost
     */
    public function calculateProfitLoss(FiscalMode|string $mode): float
    {
        $modeValue = $mode instanceof FiscalMode ? $mode->value : $mode;

        $revenue = (float) $this->invoices()
            ->where('fiscal_mode', $modeValue)
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $cost = (float) $this->purchaseOrders()
            ->where('fiscal_mode', $modeValue)
            ->sum('total');

        return $revenue - $cost;
    }
}
