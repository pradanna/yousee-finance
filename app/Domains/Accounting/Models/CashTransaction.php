<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Traits\HasFiscalMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CashTransaction extends Model
{
    use HasFactory, HasFiscalMode, HasUuids;

    protected $table = 'cash_transactions';

    protected $fillable = [
        'transaction_number',
        'fiscal_mode',
        'payment_account_id',
        'expense_account_id',
        'project_id',
        'amount',
        'transaction_date',
        'recipient',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fiscal_mode' => FiscalMode::class,
            'amount' => 'decimal:2',
            'transaction_date' => 'date',
        ];
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'payment_account_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'expense_account_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function journalEntry(): MorphOne
    {
        return $this->morphOne(JournalEntry::class, 'source');
    }
}
