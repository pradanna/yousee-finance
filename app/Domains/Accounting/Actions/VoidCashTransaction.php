<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Shared\Models\AuditLog;
use DomainException;
use Illuminate\Support\Facades\DB;

class VoidCashTransaction
{
    public function execute(CashTransaction $transaction, string $reason, ?string $userId = null): void
    {
        if ($transaction->isVoid()) {
            throw new DomainException("Transaksi {$transaction->transaction_number} sudah dalam status dibatalkan (Void).");
        }

        $dateStr = $transaction->transaction_date instanceof \DateTimeInterface
            ? $transaction->transaction_date->format('Y-m-d')
            : (string) $transaction->transaction_date;

        $dateObj = new \DateTimeImmutable($dateStr);
        $month = (int) $dateObj->format('n');
        $year = (int) $dateObj->format('Y');

        // 1. INVARIANT CHECK: Closing Period Lock
        if (ClosingPeriod::isClosed($month, $year, $transaction->fiscal_mode)) {
            throw new DomainException("Transaksi tidak dapat dibatalkan karena periode {$month}-{$year} ({$transaction->fiscal_mode->value}) telah ditutup/dikunci.");
        }

        DB::transaction(function () use ($transaction, $reason, $userId, $dateStr): void {
            // 2. Terbitkan Jurnal Pembalik (Reversing Entry) Otomatis
            // Asli: (Dr) Beban, (Cr) Kas
            // Pembalik: (Dr) Kas, (Cr) Beban
            JournalEntry::$allowSystemMutation = true;
            try {
                $reversingNumber = 'REV-' . $transaction->transaction_number;
                
                $reversingJournal = JournalEntry::create([
                    'number'           => $reversingNumber,
                    'fiscal_mode'      => $transaction->fiscal_mode,
                    'transaction_date' => $dateStr,
                    'description'      => "Jurnal Pembalik (Void) Pembatalan Transaksi {$transaction->transaction_number}: {$reason}",
                    'source_type'      => CashTransaction::class,
                    'source_id'        => $transaction->id,
                    'is_reversal'      => true,
                    'posted_by'        => $userId ?? $transaction->created_by,
                ]);

                // Debet: Kas/Bank (Memulihkan saldo kas)
                JournalEntryItem::create([
                    'journal_entry_id' => $reversingJournal->id,
                    'account_id'       => $transaction->payment_account_id,
                    'debit'            => $transaction->amount,
                    'credit'           => 0,
                    'memo'             => "Pemulihan Saldo Kas (Void {$transaction->transaction_number})",
                ]);

                // Kredit: Beban (Menghapus beban dari L/R)
                JournalEntryItem::create([
                    'journal_entry_id' => $reversingJournal->id,
                    'account_id'       => $transaction->expense_account_id,
                    'debit'            => 0,
                    'credit'           => $transaction->amount,
                    'memo'             => "Pembalik Beban (Void {$transaction->transaction_number})",
                ]);
            } finally {
                JournalEntry::$allowSystemMutation = false;
            }

            // 3. Update Status Transaksi Kas
            $transaction->update([
                'status'      => 'voided',
                'voided_at'   => now(),
                'voided_by'   => $userId ?? auth()->id(),
                'void_reason' => $reason,
            ]);

            // 4. Catat ke Tabel Audit Log
            AuditLog::create([
                'auditable_type' => CashTransaction::class,
                'auditable_id'   => $transaction->id,
                'event'          => 'voided',
                'user_id'        => $userId ?? auth()->id(),
                'description'    => "Membatalkan (Void) transaksi kas {$transaction->transaction_number} sebesar Rp " . number_format((float)$transaction->amount, 0, ',', '.') . " dengan alasan: {$reason}",
                'properties'     => [
                    'transaction_number' => $transaction->transaction_number,
                    'amount'             => (float) $transaction->amount,
                    'reason'             => $reason,
                    'voided_at'          => now()->toIso8601String(),
                ],
            ]);
        });
    }
}
