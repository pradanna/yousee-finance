<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashInTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use DomainException;
use Illuminate\Support\Facades\DB;

class CreateCashInTransaction
{
    /**
     * @param array{
     *     fiscal_mode: FiscalMode|string,
     *     deposit_account_id: string,
     *     source_account_id: string,
     *     project_id?: string|null,
     *     amount: float|int|string,
     *     transaction_date: string,
     *     payer?: string|null,
     *     description: string,
     *     attachment_path?: string|null,
     *     attachment_name?: string|null,
     *     created_by: string,
     * } $data
     */
    public function execute(array $data): CashInTransaction
    {
        $fiscalMode = $data['fiscal_mode'] instanceof FiscalMode
            ? $data['fiscal_mode']
            : FiscalMode::from((string) $data['fiscal_mode']);

        $amount = (float) $data['amount'];
        if ($amount <= 0) {
            throw new DomainException('Nominal penerimaan kas harus lebih besar dari 0.');
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
        $depositAccount = ChartOfAccount::findOrFail($data['deposit_account_id']);
        if (! $depositAccount->isLeaf()) {
            throw new DomainException("Akun penerima '{$depositAccount->code} - {$depositAccount->name}' adalah header. Pilih akun kas/bank tingkat transaksi (leaf).");
        }

        $sourceAccount = ChartOfAccount::findOrFail($data['source_account_id']);
        if (! $sourceAccount->isLeaf()) {
            throw new DomainException("Akun sumber '{$sourceAccount->code} - {$sourceAccount->name}' adalah header. Pilih akun sumber dana tingkat transaksi (leaf).");
        }

        return DB::transaction(function () use ($data, $fiscalMode, $amount, $txDate, $year, $month, $depositAccount, $sourceAccount): CashInTransaction {
            // Generate Transaction Number: IN-YYYYMM-XXXX
            $prefix = sprintf('IN-%04d%02d-', $year, $month);
            $lastTx = CashInTransaction::where('transaction_number', 'like', $prefix.'%')
                ->orderByDesc('transaction_number')
                ->lockForUpdate()
                ->first();

            $sequence = 1;
            if ($lastTx && preg_match('/-(\d{4})$/', $lastTx->transaction_number, $matches)) {
                $sequence = ((int) $matches[1]) + 1;
            }
            $txNumber = sprintf('%s%04d', $prefix, $sequence);

            $cashInTransaction = CashInTransaction::create([
                'transaction_number' => $txNumber,
                'fiscal_mode'        => $fiscalMode,
                'deposit_account_id' => $data['deposit_account_id'],
                'source_account_id'  => $data['source_account_id'],
                'project_id'         => $data['project_id'] ?? null,
                'amount'             => $amount,
                'transaction_date'   => $txDate,
                'payer'              => $data['payer'] ?? null,
                'description'        => $data['description'],
                'attachment_path'    => $data['attachment_path'] ?? null,
                'attachment_name'    => $data['attachment_name'] ?? null,
                'status'             => 'active',
                'created_by'         => $data['created_by'],
            ]);

            // Otomatis bentuk Jurnal Akuntansi Penerimaan Kas:
            // (Dr) Deposit Account (Kas/Bank Bertambah)
            // (Cr) Source Account (Modal / Hutang / Pendapatan Bertambah)
            (new PostJournalEntry())->execute(
                headerData: [
                    'fiscal_mode'      => $fiscalMode,
                    'transaction_date' => $txDate,
                    'project_id'       => $data['project_id'] ?? null,
                    'description'      => "Penerimaan Kas [{$txNumber}]: {$data['description']}" . (! empty($data['payer']) ? " (Penyetor: {$data['payer']})" : ''),
                    'posted_by'        => $data['created_by'],
                ],
                items: [
                    [
                        'account_id' => $depositAccount->id,
                        'debit'      => $amount,
                        'credit'     => 0,
                        'project_id' => $data['project_id'] ?? null,
                        'memo'       => "Kas/Bank: {$depositAccount->name}",
                    ],
                    [
                        'account_id' => $sourceAccount->id,
                        'debit'      => 0,
                        'credit'     => $amount,
                        'project_id' => $data['project_id'] ?? null,
                        'memo'       => "Sumber: {$sourceAccount->name}",
                    ],
                ],
                source: $cashInTransaction,
            );

            // Catat ke Audit Log
            AuditLog::create([
                'auditable_type' => CashInTransaction::class,
                'auditable_id'   => $cashInTransaction->id,
                'event'          => 'created',
                'user_id'        => $data['created_by'],
                'description'    => "Mencatat penerimaan kas baru [{$txNumber}] sebesar Rp " . number_format($amount, 0, ',', '.') . " ke {$depositAccount->name} (Sumber: {$sourceAccount->name})",
                'properties'     => [
                    'transaction_number' => $txNumber,
                    'amount'             => $amount,
                    'deposit_account'    => $depositAccount->name,
                    'source_account'     => $sourceAccount->name,
                    'payer'              => $data['payer'] ?? null,
                ],
            ]);

            return $cashInTransaction->load(['depositAccount', 'sourceAccount', 'project', 'creator', 'journalEntry.items.account']);
        });
    }
}
