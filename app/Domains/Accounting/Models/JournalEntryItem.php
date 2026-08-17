<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Project\Models\Project;
use DomainException;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalEntryItem extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'journal_entry_items';

    protected $fillable = [
        'journal_entry_id',
        'account_id',
        'project_id',
        'debit',
        'credit',
        'memo',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $item) {
            // Invariant: exactly one of debit/credit is non-zero
            $debit = (float) $item->debit;
            $credit = (float) $item->credit;

            if (($debit <= 0 && $credit <= 0) || ($debit > 0 && $credit > 0)) {
                throw new DomainException('Journal line must have either debit OR credit greater than 0, not both or neither.');
            }

            // Invariant: account_id must point to a leaf account
            $account = ChartOfAccount::find($item->account_id);
            if ($account && ! $account->isLeaf()) {
                throw new DomainException("Cannot post to header account '{$account->code} - {$account->name}'. Only leaf accounts are allowed.");
            }
        });
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
