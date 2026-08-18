<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Support\Facades\DB;

class CreateCashTransaction
{
    /**
     * @param array{
     *     fiscal_mode: FiscalMode|string,
     *     payment_account_id: string,
     *     expense_account_id: string,
     *     project_id?: string|null,
     *     amount: float|int|string,
     *     transaction_date: string,
     *     recipient?: string|null,
     *     description: string,
     *     created_by: string,
     * } $data
     */
    public function execute(array $data): CashTransaction
    {
        $fiscalMode = $data['fiscal_mode'] instanceof FiscalMode
            ? $data['fiscal_mode']
            : FiscalMode::from((string) $data['fiscal_mode']);

        $amount = (float) $data['amount'];
        if ($amount <= 0) {
            throw new DomainException('Nominal pengeluaran kas harus lebih besar dari 0.');
        }

        $txDate = $data['transaction_date'];
        $dateObj = new \DateTimeImmutable($txDate);
        $month = (int) $dateObj->format('n');
        $year = (int) $dateObj->format('Y');

        // 1. INVARIANT CHECK: Closing Period
        if (ClosingPeriod::isClosed($month, $year, $fiscalMode)) {
            throw new DomainException("Periode akuntansi {$month}-{$year} ({$fiscalMode->value}) telah ditutup.");
        }

        // 2. INVARIANT CHECK: Leaf node checks
        $paymentAccount = ChartOfAccount::findOrFail($data['payment_account_id']);
        if (! $paymentAccount->isLeaf()) {
            throw new DomainException("Akun sumber '{$paymentAccount->code} - {$paymentAccount->name}' adalah header. Pilih akun kas/bank tingkat transaksi (leaf).");
        }

        $expenseAccount = ChartOfAccount::findOrFail($data['expense_account_id']);
        if (! $expenseAccount->isLeaf()) {
            throw new DomainException("Akun beban '{$expenseAccount->code} - {$expenseAccount->name}' adalah header. Pilih akun beban tingkat transaksi (leaf).");
        }

        return DB::transaction(function () use ($data, $fiscalMode, $amount, $txDate, $year, $month, $paymentAccount, $expenseAccount): CashTransaction {
            // Generate Transaction Number: OUT-YYYYMM-XXXX
            $prefix = sprintf('OUT-%04d%02d-', $year, $month);
            $lastTx = CashTransaction::where('transaction_number', 'like', $prefix.'%')
                ->orderByDesc('transaction_number')
                ->lockForUpdate()
                ->first();

            $sequence = 1;
            if ($lastTx && preg_match('/-(\d{4})$/', $lastTx->transaction_number, $matches)) {
                $sequence = ((int) $matches[1]) + 1;
            }
            $txNumber = sprintf('%s%04d', $prefix, $sequence);

            $cashTransaction = CashTransaction::create([
                'transaction_number' => $txNumber,
                'fiscal_mode'        => $fiscalMode,
                'payment_account_id' => $data['payment_account_id'],
                'expense_account_id' => $data['expense_account_id'],
                'project_id'         => $data['project_id'] ?? null,
                'amount'             => $amount,
                'transaction_date'   => $txDate,
                'recipient'          => $data['recipient'] ?? null,
                'description'        => $data['description'],
                'created_by'         => $data['created_by'],
            ]);

            // Otomatis bentuk Jurnal Akuntansi Pengeluaran Kas (Flow C.1 direct operational expense)
            // (Dr) Expense Account = (Cr) Payment Account
            (new PostJournalEntry())->execute(
                headerData: [
                    'fiscal_mode'      => $fiscalMode,
                    'transaction_date' => $txDate,
                    'project_id'       => $data['project_id'] ?? null,
                    'description'      => "Pengeluaran Kas [{$txNumber}]: {$data['description']}" . ($data['recipient'] ? " (Penerima: {$data['recipient']})" : ''),
                    'posted_by'        => $data['created_by'],
                ],
                items: [
                    [
                        'account_id' => $expenseAccount->id,
                        'debit'      => $amount,
                        'credit'     => 0,
                        'project_id' => $data['project_id'] ?? null,
                        'memo'       => "Beban: {$expenseAccount->name}",
                    ],
                    [
                        'account_id' => $paymentAccount->id,
                        'debit'      => 0,
                        'credit'     => $amount,
                        'project_id' => $data['project_id'] ?? null,
                        'memo'       => "Kas/Bank: {$paymentAccount->name}",
                    ],
                ],
                source: $cashTransaction,
            );

            return $cashTransaction->load(['paymentAccount', 'expenseAccount', 'project', 'creator', 'journalEntry.items']);
        });
    }
}
