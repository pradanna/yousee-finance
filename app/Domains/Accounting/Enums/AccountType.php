<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Enums;

enum AccountType: string
{
    case ASSET = 'asset';
    case LIABILITY = 'liability';
    case EQUITY = 'equity';
    case REVENUE = 'revenue';
    case EXPENSE = 'expense';

    public function defaultNormalBalance(): NormalBalance
    {
        return match ($this) {
            self::ASSET, self::EXPENSE => NormalBalance::DEBIT,
            self::LIABILITY, self::EQUITY, self::REVENUE => NormalBalance::CREDIT,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::ASSET => 'Aset (Aktiva)',
            self::LIABILITY => 'Kewajiban (Hutang)',
            self::EQUITY => 'Ekuitas (Modal)',
            self::REVENUE => 'Pendapatan',
            self::EXPENSE => 'Beban / Pengeluaran',
        };
    }
}
