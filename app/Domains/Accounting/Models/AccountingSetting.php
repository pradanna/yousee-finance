<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Models;

use DomainException;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingSetting extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'accounting_settings';

    protected $fillable = [
        'key',
        'account_id',
        'description',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $setting) {
            $account = ChartOfAccount::find($setting->account_id);
            if ($account && ! $account->isLeaf()) {
                throw new DomainException("Accounting setting '{$setting->key}' must point to a leaf account.");
            }
        });
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    /**
     * Resolve account id by key.
     */
    public static function getAccountId(string $key): ?string
    {
        return static::where('key', $key)->value('account_id');
    }

    /**
     * Resolve ChartOfAccount model by key.
     */
    public static function getAccount(string $key): ?ChartOfAccount
    {
        $setting = static::with('account')->where('key', $key)->first();

        return $setting?->account;
    }
}
