<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Traits\HasFiscalMode;
use DomainException;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalEntry extends Model
{
    use HasFactory, HasFiscalMode, HasUuids;

    protected $table = 'journal_entries';

    protected $fillable = [
        'number',
        'source_type',
        'source_id',
        'project_id',
        'fiscal_mode',
        'transaction_date',
        'description',
        'is_reversal',
        'reverses_journal_id',
        'posted_by',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_mode' => FiscalMode::class,
            'transaction_date' => 'date',
            'is_reversal' => 'boolean',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::updating(function () {
            throw new DomainException('Jurnal tidak boleh diedit secara langsung. Gunakan jurnal pembalik (reversal) untuk koreksi.');
        });

        static::deleting(function () {
            throw new DomainException('Jurnal tidak boleh dihapus secara langsung. Koreksi harus menggunakan reversing entry (jurnal pembalik).');
        });
    }

    /**
     * Polymorphic relation ke sumber jurnal (misal Invoice, PurchaseOrder, PaymentSettlement, CashExpense).
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class, 'journal_entry_id');
    }

    public function reversesJournal(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reverses_journal_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /**
     * Memeriksa apakah total Debet sama dengan Kredit.
     */
    public function isBalanced(): bool
    {
        $debit = (float) $this->items()->sum('debit');
        $credit = (float) $this->items()->sum('credit');

        return abs($debit - $credit) < 0.01;
    }

    /**
     * Memvalidasi keseimbangan jurnal (Hard Invariant).
     */
    public function validateBalance(): void
    {
        if (! $this->isBalanced()) {
            $debit = (float) $this->items()->sum('debit');
            $credit = (float) $this->items()->sum('credit');
            throw new DomainException("Total Debet ({$debit}) harus sama dengan Total Kredit ({$credit}). Jurnal tidak seimbang.");
        }
    }
}
