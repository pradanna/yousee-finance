<?php

declare(strict_types=1);

namespace App\Domains\Sales\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Factories\SalesFactory;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sales extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'sales';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'commission_rate',
        'is_archived',
    ];

    protected $casts = [
        'commission_rate' => 'float',
        'is_archived' => 'boolean',
    ];

    protected static function newFactory(): SalesFactory
    {
        return SalesFactory::new();
    }

    protected static function booted(): void
    {
        static::deleting(function (Sales $sales): void {
            if ($sales->projects()->exists()) {
                throw new DomainException('Tidak dapat menghapus personil sales yang masih memiliki proyek aktif.');
            }
            if ($sales->invoices()->exists()) {
                throw new DomainException('Tidak dapat menghapus personil sales yang masih memiliki transaksi invoice.');
            }
        });
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'sales_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'sales_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_archived', true);
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
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');
    }
}
