<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UpdateCashTransaction
{
    /**
     * @param array{
     *     fiscal_mode: FiscalMode|string,
     *     payment_account_id: string,
     *     expense_account_id: string,
     *     amount: float|int|string,
     *     transaction_date: string,
     *     recipient?: string|null,
     *     description: string,
     *     attachment_path?: string|null,
     *     attachment_name?: string|null,
     * } $data
     */
    public function execute(CashTransaction $transaction, array $data): CashTransaction
    {
        $oldDateStr = $transaction->transaction_date instanceof \DateTimeInterface
            ? $transaction->transaction_date->format('Y-m-d')
            : (string) $transaction->transaction_date;

        $oldDate = new \DateTimeImmutable($oldDateStr);
        $oldMonth = (int) $oldDate->format('n');
        $oldYear = (int) $oldDate->format('Y');

        // 1. INVARIANT CHECK: Closing Period pada tanggal awal
        if (ClosingPeriod::isClosed($oldMonth, $oldYear, $transaction->fiscal_mode)) {
            throw new DomainException("Transaksi tidak dapat diedit karena periode {$oldMonth}-{$oldYear} ({$transaction->fiscal_mode->value}) telah ditutup/dikunci.");
        }

        $fiscalMode = $data['fiscal_mode'] instanceof FiscalMode
            ? $data['fiscal_mode']
            : FiscalMode::from((string) $data['fiscal_mode']);

        $amount = (float) $data['amount'];
        if ($amount <= 0) {
            throw new DomainException('Nominal pengeluaran kas harus lebih besar dari 0.');
        }

        $newDate = new \DateTimeImmutable($data['transaction_date']);
        $newMonth = (int) $newDate->format('n');
        $newYear = (int) $newDate->format('Y');

        // 2. INVARIANT CHECK: Closing Period pada tanggal baru (jika tanggal diubah)
        if (ClosingPeriod::isClosed($newMonth, $newYear, $fiscalMode)) {
            throw new DomainException("Tanggal baru berada di periode {$newMonth}-{$newYear} ({$fiscalMode->value}) yang telah ditutup/dikunci.");
        }

        // 3. INVARIANT CHECK: Leaf node checks
        $paymentAccount = ChartOfAccount::findOrFail($data['payment_account_id']);
        if (! $paymentAccount->isLeaf()) {
            throw new DomainException("Akun sumber '{$paymentAccount->code} - {$paymentAccount->name}' adalah header. Pilih akun kas/bank tingkat transaksi (leaf).");
        }

        $expenseAccount = ChartOfAccount::findOrFail($data['expense_account_id']);
        if (! $expenseAccount->isLeaf()) {
            throw new DomainException("Akun beban '{$expenseAccount->code} - {$expenseAccount->name}' adalah header. Pilih akun beban tingkat transaksi (leaf).");
        }

        return DB::transaction(function () use ($transaction, $data, $fiscalMode, $amount, $paymentAccount, $expenseAccount): CashTransaction {
            // Hapus file attachment lama jika ada file baru yang diunggah
            if (isset($data['attachment_path']) && $transaction->attachment_path && $transaction->attachment_path !== $data['attachment_path']) {
                $oldFullPath = public_path($transaction->attachment_path);
                if (file_exists($oldFullPath) && is_file($oldFullPath)) {
                    @unlink($oldFullPath);
                }
            }

            $updatePayload = [
                'fiscal_mode'        => $fiscalMode,
                'payment_account_id' => $data['payment_account_id'],
                'expense_account_id' => $data['expense_account_id'],
                'amount'             => $amount,
                'transaction_date'   => $data['transaction_date'],
                'recipient'          => $data['recipient'] ?? null,
                'description'        => $data['description'],
            ];

            if (array_key_exists('attachment_path', $data)) {
                $updatePayload['attachment_path'] = $data['attachment_path'];
            }
            if (array_key_exists('attachment_name', $data)) {
                $updatePayload['attachment_name'] = $data['attachment_name'];
            }

            $transaction->update($updatePayload);

            // Update Jurnal Akuntansi terkait
            $journal = $transaction->journalEntry;
            if ($journal) {
                JournalEntry::$allowSystemMutation = true;
                try {
                    $journal->update([
                        'fiscal_mode'      => $fiscalMode,
                        'transaction_date' => $data['transaction_date'],
                        'description'      => "Pengeluaran Kas [{$transaction->transaction_number}]: {$data['description']}" . ($data['recipient'] ? " (Penerima: {$data['recipient']})" : ''),
                    ]);

                    // Hapus item lama dan buat baru sesuai akun & nominal terupdate
                    $journal->items()->delete();
                    $journal->items()->createMany([
                        [
                            'account_id' => $expenseAccount->id,
                            'debit'      => $amount,
                            'credit'     => 0,
                            'memo'       => "Beban: {$expenseAccount->name}",
                        ],
                        [
                            'account_id' => $paymentAccount->id,
                            'debit'      => 0,
                            'credit'     => $amount,
                            'memo'       => "Kas/Bank: {$paymentAccount->name}",
                        ],
                    ]);
                } finally {
                    JournalEntry::$allowSystemMutation = false;
                }
            }

            // Catat ke Audit Log
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => CashTransaction::class,
                'auditable_id'   => $transaction->id,
                'event'          => 'updated',
                'user_id'        => auth()->id(),
                'description'    => "Memperbarui data transaksi [{$transaction->transaction_number}] menjadi Rp " . number_format($amount, 0, ',', '.') . " ({$expenseAccount->name})",
                'properties'     => [
                    'transaction_number' => $transaction->transaction_number,
                    'amount'             => $amount,
                    'payment_account'    => $paymentAccount->name,
                    'expense_account'    => $expenseAccount->name,
                ],
            ]);

            return $transaction->fresh(['paymentAccount', 'expenseAccount', 'creator', 'journalEntry.items']);
        });
    }
}
