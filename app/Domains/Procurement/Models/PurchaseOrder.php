<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Models;

use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Traits\HasFiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class PurchaseOrder extends Model
{
    use HasFactory, HasFiscalMode, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\PurchaseOrderFactory::new();
    }

    protected $fillable = [
        'po_number',
        'vendor_id',
        'project_id',
        'expense_account_id',
        'fiscal_mode',
        'transaction_date',
        'issued_at',
        'subtotal',
        'ppn',
        'total',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_mode' => FiscalMode::class,
            'status' => PurchaseOrderStatus::class,
            'transaction_date' => 'date',
            'issued_at' => 'date',
            'subtotal' => 'decimal:2',
            'ppn' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Hitung ulang subtotal/ppn/total dari items. ppn = 0 di luar mode PPN,
     * expense_account_id/COA resolution & journal posting belum aktif —
     * nunggu domain Accounting (chart_of_accounts, closing_periods) ada.
     */
    public function recalculateTotal(): void
    {
        $subtotal = (float) $this->items()->sum(DB::raw('quantity * price'));
        $isPpn = $this->fiscal_mode instanceof FiscalMode
            ? $this->fiscal_mode === FiscalMode::PPN
            : $this->fiscal_mode === FiscalMode::PPN->value;
        $ppn = $isPpn ? round($subtotal * 0.11, 2) : 0.0;

        $this->subtotal = $subtotal;
        $this->ppn = $ppn;
        $this->total = $subtotal + $ppn;
        $this->saveQuietly();
    }
}
