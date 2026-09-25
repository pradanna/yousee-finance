<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Domains\Shared\Traits\HasFiscalMode;
use Database\Factories\CashInTransactionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CashInTransaction extends Model
{
    use HasFactory, HasFiscalMode, HasUuids;

    protected $table = 'cash_in_transactions';

    protected $fillable = [
        'transaction_number',
        'fiscal_mode',
        'deposit_account_id',
        'source_account_id',
        'project_id',
        'amount',
        'transaction_date',
        'payer',
        'description',
        'attachment_path',
        'attachment_name',
        'status',
        'voided_at',
        'voided_by',
        'void_reason',
        'created_by',
    ];

    protected $appends = [
        'attachment_url',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_mode' => FiscalMode::class,
            'amount' => 'decimal:2',
            'transaction_date' => 'date',
            'voided_at' => 'datetime',
        ];
    }

    protected static function newFactory(): CashInTransactionFactory
    {
        return CashInTransactionFactory::new();
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (empty($this->attachment_path)) {
            return null;
        }

        if (str_starts_with($this->attachment_path, 'uploads/')) {
            return asset($this->attachment_path);
        }

        return asset('uploads/' . $this->attachment_path);
    }

    public function isVoid(): bool
    {
        return $this->status === 'voided';
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'deposit_account_id');
    }

    public function sourceAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'source_account_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function journalEntry(): MorphOne
    {
        return $this->morphOne(JournalEntry::class, 'source');
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
