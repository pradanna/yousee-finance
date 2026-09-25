<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Accounting\Models\CashInTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashInTransaction>
 */
class CashInTransactionFactory extends Factory
{
    protected $model = CashInTransaction::class;

    public function definition(): array
    {
        return [
            'transaction_number' => 'IN-' . date('Ym') . '-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'deposit_account_id' => ChartOfAccount::factory(),
            'source_account_id'  => ChartOfAccount::factory(),
            'amount'             => fake()->randomFloat(2, 100_000, 50_000_000),
            'transaction_date'   => fake()->date(),
            'payer'              => fake()->name(),
            'description'        => fake()->sentence(),
            'status'             => 'active',
            'created_by'         => User::factory(),
        ];
    }
}
