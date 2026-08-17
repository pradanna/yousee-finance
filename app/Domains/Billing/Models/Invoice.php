<?php

declare(strict_types=1);

namespace App\Domains\Billing\Models;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Traits\HasFiscalMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Invoice extends Model
{
    use HasFactory, HasFiscalMode, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\InvoiceFactory::new();
    }

    protected $fillable = [
        'invoice_number',
        'client_id',
        'sales_id',
        'project_id',
        'revenue_account_id',
        'fiscal_mode',
        'transaction_date',
        'due_date',
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
            'status' => InvoiceStatus::class,
            'transaction_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'ppn' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (Invoice $invoice) {
            if (empty($invoice->client_id)) {
                throw new \InvalidArgumentException('Client wajib ditentukan.');
            }

            if ($invoice->isDirty('status')) {
                $oldStatus = $invoice->getOriginal('status') ?? InvoiceStatus::DRAFT->value;
                $oldStatus = $oldStatus instanceof InvoiceStatus ? $oldStatus->value : $oldStatus;
                $newStatus = $invoice->status instanceof InvoiceStatus ? $invoice->status->value : $invoice->status;

                if ($oldStatus === InvoiceStatus::DRAFT->value && $newStatus === InvoiceStatus::PAID->value) {
                    throw new \DomainException("Status Invoice harus melalui 'issued' sebelum menjadi 'paid'.");
                }
                if ($oldStatus === InvoiceStatus::PAID->value && $newStatus !== InvoiceStatus::PAID->value) {
                    throw new \DomainException("Status Invoice yang sudah 'paid' tidak bisa diubah kembali.");
                }
            }

            if (empty($invoice->due_date) && ! empty($invoice->transaction_date)) {
                $invoice->due_date = Carbon::parse($invoice->transaction_date)->addDays(7);
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

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function paymentPlan(): MorphOne
    {
        return $this->morphOne(PaymentPlan::class, 'payable');
    }

    /**
     * Hitung ulang subtotal/ppn/total dari items. Journal posting & Kwitansi
     * belum aktif — nunggu domain Accounting (chart_of_accounts,
     * closing_periods, journal_entries) ada.
     */
    public function recalculateTotals(): void
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
