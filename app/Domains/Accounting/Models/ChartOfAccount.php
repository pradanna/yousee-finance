<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use DomainException;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'chart_of_accounts';

    protected $fillable = [
        'parent_id',
        'code',
        'name',
        'type',
        'normal_balance',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => AccountType::class,
            'normal_balance' => NormalBalance::class,
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // IMMUTABILITY GUARD: type & normal_balance cannot change once created.
        static::updating(function (self $account) {
            if ($account->isDirty('type')) {
                throw new DomainException('Account type is immutable and cannot be changed.');
            }
            if ($account->isDirty('normal_balance')) {
                throw new DomainException('Normal balance is immutable and cannot be changed.');
            }
        });

        // PREVENT DELETION IF HAS CHILDREN OR JOURNAL ENTRIES
        static::deleting(function (self $account) {
            if ($account->children()->exists()) {
                throw new DomainException('Cannot delete an account that has child accounts.');
            }
            if ($account->journalItems()->exists()) {
                throw new DomainException('Cannot delete an account that has recorded journal transactions.');
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('code');
    }

    public function journalItems(): HasMany
    {
        return $this->hasMany(JournalEntryItem::class, 'account_id');
    }

    public function auditLogs(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(\App\Domains\Shared\Models\AuditLog::class, 'auditable');
    }

    /**
     * Strict Leaf Node Rule:
     * is_leaf is DERIVED (children_count === 0).
     * ONLY leaf accounts can be assigned to journal entries or transactions.
     */
    public function isLeaf(): bool
    {
        if ($this->relationLoaded('children')) {
            return $this->children->isEmpty();
        }

        return ! $this->children()->exists();
    }
}
