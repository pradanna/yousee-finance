<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Support\Facades\DB;

class TransferCashAccount
{
    /**
     * Mengeksekusi perpindahan dana / transfer antar rekening Kas & Bank.
     *
     * @param array{
     *     fiscal_mode: FiscalMode|string,
     *     from_account_id: string,
     *     to_account_id: string,
     *     amount: float|int|string,
     *     transaction_date: string,
     *     reference_number?: string|null,
     *     description?: string|null,
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
            throw new DomainException('Nominal transfer kas harus lebih besar dari 0.');
        }

        if ($data['from_account_id'] === $data['to_account_id']) {
            throw new DomainException('Rekening sumber dan rekening tujuan tidak boleh sama.');
        }

        $txDate = $data['transaction_date'];
        $dateObj = new \DateTimeImmutable($txDate);
        $month = (int) $dateObj->format('n');
        $year = (int) $dateObj->format('Y');

        // 1. Invariant Check: Closing Period
        if (ClosingPeriod::isClosed($month, $year, $fiscalMode)) {
            throw new DomainException("Periode akuntansi {$month}-{$year} ({$fiscalMode->value}) telah ditutup.");
        }

        // 2. Invariant Check: Leaf Node Kas / Bank
        $fromAccount = ChartOfAccount::findOrFail($data['from_account_id']);
        if (! $fromAccount->isLeaf()) {
            throw new DomainException("Rekening sumber '{$fromAccount->code} - {$fromAccount->name}' adalah header. Pilih akun kas/bank tingkat transaksi (leaf).");
        }

        $toAccount = ChartOfAccount::findOrFail($data['to_account_id']);
        if (! $toAccount->isLeaf()) {
            throw new DomainException("Rekening tujuan '{$toAccount->code} - {$toAccount->name}' adalah header. Pilih akun kas/bank tingkat transaksi (leaf).");
        }

        return DB::transaction(function () use ($data, $fiscalMode, $amount, $txDate, $year, $month, $fromAccount, $toAccount): CashTransaction {
            // Generate Transaction Number: TRF-YYYYMM-XXXX
            $prefix = sprintf('TRF-%04d%02d-', $year, $month);
            $lastTx = CashTransaction::where('transaction_number', 'like', $prefix.'%')
                ->orderByDesc('transaction_number')
                ->lockForUpdate()
                ->first();

            $sequence = 1;
            if ($lastTx && preg_match('/-(\d{4})$/', $lastTx->transaction_number, $matches)) {
                $sequence = ((int) $matches[1]) + 1;
            }
            $txNumber = sprintf('%s%04d', $prefix, $sequence);

            $memo = $data['description'] ?: "Transfer Dana dari {$fromAccount->name} ke {$toAccount->name}";

            // Buat record CashTransaction khusus transfer internal
            $cashTransaction = CashTransaction::create([
                'transaction_number'   => $txNumber,
                'fiscal_mode'          => $fiscalMode,
                'payment_account_id'   => $fromAccount->id, // Sumber (Keluar)
                'expense_account_id'   => $toAccount->id,   // Tujuan (Masuk)
                'project_id'           => null,
                'amount'               => $amount,
                'transaction_date'     => $txDate,
                'recipient'            => $toAccount->name,
                'description'          => "[INTERNAL TRANSFER] " . $memo,
                'is_internal_transfer' => true,
                'created_by'           => $data['created_by'],
            ]);

            // Otomatis bentuk Jurnal Akuntansi Mutasi Kas Internal
            // (Dr) Rekening Tujuan = (Cr) Rekening Sumber
            (new PostJournalEntry())->execute(
                headerData: [
                    'fiscal_mode'      => $fiscalMode,
                    'transaction_date' => $txDate,
                    'project_id'       => null,
                    'description'      => "Pindah Dana Antar Rekening [{$txNumber}]: {$fromAccount->name} ➔ {$toAccount->name}",
                    'posted_by'        => $data['created_by'],
                ],
                items: [
                    [
                        'account_id' => $toAccount->id,
                        'debit'      => $amount,
                        'credit'     => 0,
                        'project_id' => null,
                        'memo'       => "Penerimaan Transfer dari {$fromAccount->name}",
                    ],
                    [
                        'account_id' => $fromAccount->id,
                        'debit'      => 0,
                        'credit'     => $amount,
                        'project_id' => null,
                        'memo'       => "Pengeluaran Transfer ke {$toAccount->name}",
                    ],
                ],
                source: $cashTransaction,
            );

            // Catat ke Audit Log
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => CashTransaction::class,
                'auditable_id'   => $cashTransaction->id,
                'event'          => 'internal_transfer',
                'user_id'        => $data['created_by'],
                'description'    => "Pindah dana antar rekening [{$txNumber}] sebesar Rp " . number_format($amount, 0, ',', '.') . " dari {$fromAccount->name} ke {$toAccount->name}",
                'properties'     => [
                    'transaction_number' => $txNumber,
                    'from_account'       => $fromAccount->name,
                    'to_account'         => $toAccount->name,
                    'amount'             => $amount,
                    'reference_number'   => $data['reference_number'] ?? null,
                ],
            ]);

            return $cashTransaction->load(['paymentAccount', 'expenseAccount', 'creator', 'journalEntry.items']);
        });
    }
}
