<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Shared\Traits\HasFiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalEntry extends Model
{
    use HasFiscalMode;

    protected $fillable = [
        'source_type',
        'source_id',
        'fiscal_mode',
        'description',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::deleting(function (JournalEntry $entry) {
            throw new \DomainException("Jurnal tidak boleh dihapus secara langsung. Koreksi harus menggunakan reversing entry (jurnal pembalik).");
        });
    }

    /**
     * Polymorphic relation ke sumber jurnal (misal PurchaseOrder atau Invoice).
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function items(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class);
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
        if (!$this->isBalanced()) {
            $debit = (float) $this->items()->sum('debit');
            $credit = (float) $this->items()->sum('credit');
            throw new \DomainException("Total Debet ({$debit}) harus sama dengan Total Kredit ({$credit}). Jurnal tidak seimbang.");
        }
    }
}
